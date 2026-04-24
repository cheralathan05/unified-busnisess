import { eventBus } from "../core/events/eventBus";
import { getIO } from "./socket.server";

export function registerSocketEvents() {
  const io = getIO();

  eventBus.on("lead.updated", (lead) => {
    io.to(lead.userId).emit("lead.updated", lead);
  });
}