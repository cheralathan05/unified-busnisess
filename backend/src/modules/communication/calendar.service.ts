import { eventBus } from "../../core/events/eventBus";
import { EVENTS } from "../../constants/event.constants";
import { env } from "../../config/env";

type MeetingType = "google_meet" | "zoom" | "phone";

export class CalendarService {
  private googleAccessTokenCache?: { token: string; expiresAt: number };
  private zoomAccessTokenCache?: { token: string; expiresAt: number };

  private async getGoogleAccessToken() {
    if (env.GOOGLE_CALENDAR_ACCESS_TOKEN) {
      return env.GOOGLE_CALENDAR_ACCESS_TOKEN;
    }

    if (this.googleAccessTokenCache && this.googleAccessTokenCache.expiresAt > Date.now() + 60_000) {
      return this.googleAccessTokenCache.token;
    }

    if (!env.GOOGLE_REFRESH_TOKEN || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      throw new Error(
        "Google Meet integration needs GOOGLE_CALENDAR_ACCESS_TOKEN or GOOGLE_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET"
      );
    }

    const body = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token"
    });

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google token error: ${response.status} ${text}`);
    }

    const data: any = await response.json();
    const token = String(data?.access_token || "");
    const expiresInSeconds = Number(data?.expires_in || 3600);

    if (!token) {
      throw new Error("Google token response missing access_token");
    }

    this.googleAccessTokenCache = {
      token,
      expiresAt: Date.now() + Math.max(300, expiresInSeconds - 60) * 1000
    };

    return token;
  }

  private async getZoomAccessToken() {
    if (env.ZOOM_ACCESS_TOKEN) {
      return env.ZOOM_ACCESS_TOKEN;
    }

    if (this.zoomAccessTokenCache && this.zoomAccessTokenCache.expiresAt > Date.now() + 60_000) {
      return this.zoomAccessTokenCache.token;
    }

    if (!env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET || !env.ZOOM_ACCOUNT_ID) {
      throw new Error(
        "Zoom integration needs ZOOM_ACCESS_TOKEN or ZOOM_CLIENT_ID + ZOOM_CLIENT_SECRET + ZOOM_ACCOUNT_ID"
      );
    }

    const basicAuth = Buffer.from(`${env.ZOOM_CLIENT_ID}:${env.ZOOM_CLIENT_SECRET}`).toString("base64");
    const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(env.ZOOM_ACCOUNT_ID)}`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`
      }
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zoom token error: ${response.status} ${text}`);
    }

    const data: any = await response.json();
    const token = String(data?.access_token || "");
    const expiresInSeconds = Number(data?.expires_in || 3600);

    if (!token) {
      throw new Error("Zoom token response missing access_token");
    }

    this.zoomAccessTokenCache = {
      token,
      expiresAt: Date.now() + Math.max(300, expiresInSeconds - 60) * 1000
    };

    return token;
  }

  private async createGoogleMeetMeeting(input: {
    title: string;
    description?: string;
    dateTimeISO: string;
    attendees: string[];
  }) {
    const accessToken = await this.getGoogleAccessToken();

    const start = new Date(input.dateTimeISO);
    const end = new Date(start.getTime() + 30 * 60 * 1000);
    const conferenceRequestId = `crm-${Date.now()}`;

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(env.GOOGLE_CALENDAR_ID)}/events?conferenceDataVersion=1`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          summary: input.title,
          description: input.description || "",
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          attendees: input.attendees.map((email) => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: conferenceRequestId,
              conferenceSolutionKey: { type: "hangoutsMeet" }
            }
          }
        })
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Google Calendar error: ${response.status} ${text}`);
    }

    const data: any = await response.json();
    const link =
      data?.hangoutLink ||
      data?.conferenceData?.entryPoints?.find((entry: any) => entry?.entryPointType === "video")?.uri;

    return {
      providerMeetingId: String(data?.id || conferenceRequestId),
      meetingLink: link || null,
      providerMeta: {
        provider: "google",
        eventId: data?.id || null,
        conferenceData: data?.conferenceData || null
      },
      status: "real"
    };
  }

  private async createZoomMeeting(input: {
    title: string;
    description?: string;
    dateTimeISO: string;
  }) {
    const accessToken = await this.getZoomAccessToken();

    const response = await fetch("https://api.zoom.us/v2/users/me/meetings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        topic: input.title,
        type: 2,
        agenda: input.description || "",
        start_time: new Date(input.dateTimeISO).toISOString(),
        duration: 30,
        timezone: "UTC",
        settings: {
          join_before_host: false,
          waiting_room: true
        }
      })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Zoom API error: ${response.status} ${text}`);
    }

    const data: any = await response.json();

    return {
      providerMeetingId: String(data?.id || `zoom-${Date.now()}`),
      meetingLink: String(data?.join_url || ""),
      providerMeta: {
        provider: "zoom",
        meetingId: data?.id || null,
        startUrl: data?.start_url || null
      },
      status: "real"
    };
  }

  async createMeetingLink(input: {
    meetingType: MeetingType;
    title: string;
    description?: string;
    dateTimeISO: string;
    attendees: string[];
  }) {
    if (input.meetingType === "google_meet") {
      return this.createGoogleMeetMeeting(input);
    }

    if (input.meetingType === "zoom") {
      return this.createZoomMeeting(input);
    }

    return {
      providerMeetingId: `phone-${Date.now()}`,
      meetingLink: null,
      providerMeta: { provider: "phone" },
      status: "real"
    };
  }

  // ======================
  // SCHEDULE CALL
  // ======================
  async schedule(data: any) {
    const { time, participants, title, description, userId, leadId } = data;

    // ======================
    // VALIDATION
    // ======================
    if (!time || !participants || !Array.isArray(participants)) {
      throw new Error("Invalid scheduling data");
    }

    // ======================
    // NORMALIZE TIME
    // ======================
    const scheduledTime = new Date(time);

    if (isNaN(scheduledTime.getTime())) {
      throw new Error("Invalid date format");
    }

    // ======================
    // MOCK EVENT (FOR NOW)
    // ======================
    const event = {
      id: `call_${Date.now()}`,
      title: title || "Scheduled Call",
      description: description || "",
      time: scheduledTime,
      participants,
      leadId,
      userId,
      status: "scheduled",
      createdAt: new Date()
    };

    console.log("📅 Call scheduled:", event);

    // ======================
    // EMIT EVENT
    // ======================
    eventBus.emit(EVENTS.CALL_SCHEDULED, event);
    eventBus.emit(EVENTS.MEETING_SCHEDULED, event);

    // ======================
    // FUTURE: GOOGLE CALENDAR INTEGRATION
    // ======================
    // Example placeholder:
    /*
    await googleCalendar.createEvent({
      summary: event.title,
      description: event.description,
      start: event.time,
      attendees: participants.map(email => ({ email }))
    });
    */

    return event;
  }

  // ======================
  // CANCEL CALL
  // ======================
  async cancel(eventId: string, userId: string) {
    // mock cancel (replace with DB later)

    const result = {
      id: eventId,
      userId,
      status: "cancelled",
      cancelledAt: new Date()
    };

    console.log("❌ Call cancelled:", result);

    eventBus.emit("call.cancelled", result);

    return result;
  }

  // ======================
  // RESCHEDULE CALL
  // ======================
  async reschedule(eventId: string, newTime: string) {
    const updatedTime = new Date(newTime);

    if (isNaN(updatedTime.getTime())) {
      throw new Error("Invalid date format");
    }

    const result = {
      id: eventId,
      time: updatedTime,
      status: "rescheduled",
      updatedAt: new Date()
    };

    console.log("🔄 Call rescheduled:", result);

    eventBus.emit("call.rescheduled", result);

    return result;
  }
}