import { eventBus } from "../../core/events/eventBus";
import { Events } from "../types/event.types";

eventBus.on(Events.AUDIT_LOG, ({ userId, action, meta }) => {
  console.log("📊 Audit:", { userId, action, meta });

  // Later you can store in DB
});