import { eventBus } from "../../core/events/eventBus";
import { Events } from "../types/event.types";

eventBus.on(Events.USER_UPDATED, ({ userId }) => {
  console.log("📝 User updated:", userId);
});

eventBus.on(Events.USER_DELETED, ({ userId }) => {
  console.log("🗑️ User deleted:", userId);
});