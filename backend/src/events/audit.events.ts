// auto-generated
import { eventBus } from "../core/events/eventBus";
import { Events } from "./types/event.types";

export const emitAuditLog = (data: {
  userId?: string;
  action: string;
  meta?: any;
}) => {
  eventBus.emit(Events.AUDIT_LOG, data);
};