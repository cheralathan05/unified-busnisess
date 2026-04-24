import { Server } from "socket.io";
import { eventBus } from "../core/events/eventBus";
import { EVENTS } from "../constants/event.constants";

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", (userId: string) => {
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  /**
   * EVENT BRIDGE (Backend → Frontend)
   */

  eventBus.on("lead.created", (lead) => {
    io.to(lead.userId).emit("lead.created", lead);
  });

  eventBus.on("lead.updated", (lead) => {
    io.to(lead.userId).emit("lead.updated", lead);
  });

  eventBus.on("payment.completed", (payment) => {
    io.to(payment.userId).emit("payment.completed", payment);
  });

  eventBus.on("activity.created", (activity) => {
    io.to(activity.userId).emit("activity.created", activity);
  });

  eventBus.on("email.sent", (data) => {
    io.to(data.userId).emit("email.sent", data);
  });

  eventBus.on(EVENTS.EMAIL_OPENED, (data) => {
    io.to(data.userId).emit("email.opened", data);
  });

  eventBus.on(EVENTS.EMAIL_REPLIED, (data) => {
    io.to(data.userId).emit("email.replied", data);
  });

  eventBus.on(EVENTS.WHATSAPP_SENT, (data) => {
    io.to(data.userId).emit("whatsapp.sent", data);
  });

  eventBus.on(EVENTS.WHATSAPP_REPLIED, (data) => {
    io.to(data.userId).emit("whatsapp.replied", data);
  });

  eventBus.on(EVENTS.MEETING_SCHEDULED, (data) => {
    io.to(data.userId).emit("meeting.scheduled", data);
  });

  eventBus.on(EVENTS.MEETING_COMPLETED, (data) => {
    io.to(data.userId).emit("meeting.completed", data);
  });

  eventBus.on(EVENTS.MEETING_MISSED, (data) => {
    io.to(data.userId).emit("meeting.missed", data);
  });

  eventBus.on(EVENTS.AI_PROCESSED, (data) => {
    io.to(data.userId).emit("ai.processed", data);
  });

  eventBus.on(EVENTS.PAYMENT_SUCCESS, (data) => {
    io.to(data.userId).emit("payment.success", data);
  });

  eventBus.on(EVENTS.PAYMENT_PARTIAL, (data) => {
    io.to(data.userId).emit("payment.partial", data);
  });

  eventBus.on(EVENTS.PAYMENT_FAILED, (data) => {
    io.to(data.userId).emit("payment.failed", data);
  });

  eventBus.on(EVENTS.DASHBOARD_UPDATED, (data) => {
    io.to(data.userId).emit("dashboard.updated", data);
  });

  eventBus.on(EVENTS.PAYMENT_PROOF_UPLOADED, (data) => {
    io.to(data.userId).emit("payment.proof.uploaded", data);
  });

  eventBus.on(EVENTS.PAYMENT_VERIFICATION_COMPLETED, (data) => {
    io.to(data.userId).emit("payment.verification.completed", data);
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket not initialized");
  return io;
}