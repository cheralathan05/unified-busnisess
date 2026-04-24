import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { EmailService } from "./email.service";
import { WhatsAppService } from "./whatsapp.service";
import { CalendarService } from "./calendar.service";

const router = Router();
const emailService = new EmailService();
const whatsappService = new WhatsAppService();
const calendarService = new CalendarService();

router.use(authMiddleware);

router.post("/email", async (req, res) => {
  const user = (req as any).user;
  const to = req.body?.to;
  const subject = req.body?.subject;
  const text = req.body?.body || req.body?.text || req.body?.message;

  if (!to || !subject) {
    return res.status(400).json({ success: false, message: "Missing email" });
  }

  const result = await emailService.send({
    to,
    subject,
    text,
    userId: user.id
  });

  res.json({
    success: true,
    data: {
      status: result.status,
      messageId: result.messageId
    }
  });
});

router.post("/whatsapp", async (req, res) => {
  const user = (req as any).user;
  const to = req.body?.to || req.body?.phone;
  const message = req.body?.message || req.body?.text || req.body?.body;

  if (!to || !message) {
    return res.status(400).json({ success: false, message: "Missing WhatsApp fields" });
  }

  const result = await whatsappService.send({
    to,
    message,
    userId: user.id
  });

  res.json({
    success: true,
    data: {
      status: result.status,
      messageId: result.id
    }
  });
});

router.post("/google-meet", async (req, res) => {
  const user = (req as any).user;
  const title = String(req.body?.title || "Meeting");
  const attendees = Array.isArray(req.body?.attendees) ? req.body.attendees : [];
  const dateTime = String(req.body?.dateTime || req.body?.time || "");

  if (!dateTime || attendees.length === 0) {
    return res.status(400).json({ success: false, message: "Missing schedule fields" });
  }

  const meeting = await calendarService.createMeetingLink({
    meetingType: "google_meet",
    title,
    description: req.body?.description || "",
    dateTimeISO: dateTime,
    attendees
  });

  const event = await calendarService.schedule({
    title,
    time: dateTime,
    participants: attendees,
    userId: user.id,
    description: req.body?.description || ""
  });

  res.json({
    success: true,
    data: {
      eventId: event.id,
      meetLink: meeting.meetingLink,
      status: meeting.status,
      providerMeta: meeting.providerMeta,
      time: event.time
    }
  });
});

export default router;
