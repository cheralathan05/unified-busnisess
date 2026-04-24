import { eventBus } from "../core/events/eventBus";

// Backward-compatible alias kept for existing imports.
// All event transport now resolves to a single bus implementation.
export const eventEmitter = eventBus;