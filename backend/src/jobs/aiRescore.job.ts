import { db } from "../config/db";
import { runAI } from "../modules/ai/ai.orchestrator";

export async function aiRescoreJob() {
  const leads = await db.lead.findMany();

  for (const lead of leads) {
    const ai = await runAI(lead);

    await db.lead.update({
      where: { id: lead.id },
      data: { score: ai.score }
    });
  }

  console.log("AI Rescore Job completed");
}