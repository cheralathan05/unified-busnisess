// auto-generated
import { eventBus } from "../core/events/eventBus";
import { Events } from "./types/event.types";

export const emitUserUpdated = (data: {
  userId: string;
}) => {
  eventBus.emit(Events.USER_UPDATED, data);
};

export const emitUserDeleted = (data: {
  userId: string;
}) => {
  eventBus.emit(Events.USER_DELETED, data);
};