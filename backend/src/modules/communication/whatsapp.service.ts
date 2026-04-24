import { eventBus } from "../../core/events/eventBus";
import { EVENTS } from "../../constants/event.constants";
import { env } from "../../config/env";

export class WhatsAppService {
  private isTwilioConfigured() {
    return Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM);
  }

  private async sendWithTwilio(phone: string, message: string) {
    const accountSid = String(env.TWILIO_ACCOUNT_SID);
    const authToken = String(env.TWILIO_AUTH_TOKEN);
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const params = new URLSearchParams();

    params.set("From", `whatsapp:${String(env.TWILIO_WHATSAPP_FROM)}`);
    params.set("To", `whatsapp:${phone}`);
    params.set("Body", message);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Twilio error: ${response.status} ${text}`);
    }

    return response.json();
  }

  // ======================
  // SEND MESSAGE
  // ======================
  async send(data: any) {
    const { to, message, userId, leadId } = data;

    // ======================
    // VALIDATION
    // ======================
    if (!to || !message) {
      throw new Error("Missing WhatsApp fields");
    }

    // ======================
    // NORMALIZE PHONE
    // ======================
    const phone = this.formatPhone(to);

    let providerMessageId = `wa_${Date.now()}`;

    if (this.isTwilioConfigured()) {
      try {
        const twilio = await this.sendWithTwilio(phone, message);
        providerMessageId = String(twilio?.sid || providerMessageId);
      } catch (error) {
        if (process.env.NODE_ENV === "production") {
          throw error;
        }
        console.warn("[whatsapp] Twilio send failed in non-production, using mock", error);
      }
    } else {
      console.log("📲 WhatsApp sent (mock mode):", {
        to: phone,
        message,
        userId
      });
    }

    const result = {
      id: providerMessageId,
      to: phone,
      message,
      status: "sent",
      createdAt: new Date(),
      userId,
      leadId
    };

    // ======================
    // EMIT EVENT
    // ======================
    eventBus.emit(EVENTS.WHATSAPP_SENT, result);

    // ======================
    // FUTURE: TWILIO API
    // ======================
    /*
    await twilioClient.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${phone}`,
      body: message
    });
    */

    return result;
  }

  // ======================
  // HELPER: FORMAT PHONE
  // ======================
  private formatPhone(phone: string) {
    // remove spaces, dashes
    const cleaned = phone.replace(/[^\d+]/g, "");

    // add + if missing (basic logic)
    if (!cleaned.startsWith("+")) {
      return `+91${cleaned}`; // default India (you can change)
    }

    return cleaned;
  }
}