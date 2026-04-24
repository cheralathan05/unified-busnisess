import { db } from "../../config/db";

export interface AIContext {
  lead: {
    id: string;
    userId: string;
    company: string;
    stage: string;
    value: number;
    score: number;
    updatedAt: Date;
  };
  activities: Array<{
    id: string;
    type: string;
    text: string | null;
    createdAt: Date;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
}

export async function gatherAIContext(leadId: string): Promise<AIContext | null> {
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      userId: true,
      company: true,
      stage: true,
      value: true,
      score: true,
      updatedAt: true
    }
  });

  if (!lead) return null;

  const [activities, payments] = await Promise.all([
    db.activity.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        type: true,
        text: true,
        createdAt: true
      }
    }),
    db.payment.findMany({
      where: { leadId },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true
      }
    })
  ]);

  return {
    lead,
    activities,
    payments
  };
}
