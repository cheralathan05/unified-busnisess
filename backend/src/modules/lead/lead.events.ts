import { eventBus } from "../../core/events/eventBus";
import { enrichLeadWithAI } from "../ai/ai.service";

eventBus.on("lead.created", (lead) => {
  console.log("Lead created:", lead.id);
  void enrichLeadWithAI(String(lead.id)).catch((error) => {
    console.warn("AI enrichment failed on lead.created:", error);
  });
});

eventBus.on("lead.updated", (lead) => {
  console.log("Lead updated:", lead.id);
  void enrichLeadWithAI(String(lead.id)).catch((error) => {
    console.warn("AI enrichment failed on lead.updated:", error);
  });
});