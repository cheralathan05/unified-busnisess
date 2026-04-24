import { eventBus } from "../../core/events/eventBus";
import { brainService } from "./brain.service";
import { BrainObservedEvent } from "./brain.types";

const observedEvents: BrainObservedEvent[] = [
  "lead.created",
  "lead.updated",
  "activity.created"
];

for (const eventName of observedEvents) {
  eventBus.on(eventName, async (payload: Record<string, unknown>) => {
    try {
      await brainService.processEvent({
        event: eventName,
        payload
      });
    } catch (error) {
      console.error(`[brain] failed processing ${eventName}:`, error);
    }
  });
}

// Example lifecycle listeners
eventBus.on("brain.decision.suggested", (decision) => {
  console.log("[brain] suggestion created:", decision.id);
});

eventBus.on("brain.decision.approved", (decision) => {
  console.log("[brain] suggestion approved:", decision.id);
});

eventBus.on("brain.decision.rejected", (decision) => {
  console.log("[brain] suggestion rejected:", decision.id);
});
