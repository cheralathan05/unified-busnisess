import { eventBus } from "../../core/events/eventBus";

eventBus.on("activity.created", (activity) => {
  console.log("Activity created:", activity.id);
});