// auto-generated
// src/modules/notification/notification.types.ts

export type NotificationChannel = "EMAIL" | "SMS" | "IN_APP";

export interface SendNotificationInput {
  to: string;
  subject?: string;
  message: string;
  html?: string;
  channel: NotificationChannel;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}