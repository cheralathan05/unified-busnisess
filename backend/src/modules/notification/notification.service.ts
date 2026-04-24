// auto-generated
// src/modules/notification/notification.service.ts

import { SendNotificationInput } from "./notification.types";
import { NOTIFICATION_CHANNELS, NOTIFICATION_ERRORS } from "./notification.constants";
import { addEmailToQueue } from "../../jobs/emailQueue.job";

export const sendNotification = async (input: SendNotificationInput) => {
  switch (input.channel) {
    case NOTIFICATION_CHANNELS.EMAIL:
      return sendEmailNotification(input);

    case NOTIFICATION_CHANNELS.SMS:
      return sendSMSNotification(input);

    case NOTIFICATION_CHANNELS.IN_APP:
      return sendInAppNotification(input);

    default:
      throw new Error(NOTIFICATION_ERRORS.INVALID_CHANNEL);
  }
};

// 📧 EMAIL
const sendEmailNotification = async (input: SendNotificationInput) => {
  if (!input.subject || !input.html) {
    throw new Error("Email requires subject and html");
  }

  await addEmailToQueue({
    to: input.to,
    subject: input.subject,
    html: input.html,
  });

  return { success: true, type: "EMAIL_SENT" };
};

// 📱 SMS (placeholder)
const sendSMSNotification = async (input: SendNotificationInput) => {
  console.log("📱 SMS:", input.message);

  return { success: true, type: "SMS_SENT" };
};

// 🔔 IN-APP (placeholder)
const sendInAppNotification = async (input: SendNotificationInput) => {
  console.log("🔔 In-App Notification:", input.message);

  return { success: true, type: "IN_APP_SENT" };
};