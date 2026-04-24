import { eventBus } from "../../core/events/eventBus";

eventBus.on("payment.completed", (payment) => {
  console.log("Payment completed:", payment.id);
});