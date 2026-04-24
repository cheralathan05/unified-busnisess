import { db } from "../../config/db";

function similarity(a?: string, b?: string): number {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();

  if (a === b) return 100;

  // simple similarity
  let matches = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++;
  }

  return (matches / Math.max(a.length, b.length)) * 100;
}

export class DedupService {
  async findDuplicates(user: any) {
    const leads = await db.lead.findMany({
      where: { userId: user.id }
    });

    const groups: any[] = [];

    for (let i = 0; i < leads.length; i++) {
      const base = leads[i];
      const duplicates: string[] = [];

      for (let j = i + 1; j < leads.length; j++) {
        const compare = leads[j];

        const emailScore = similarity(base.email, compare.email);
        const phoneScore = similarity(base.phone, compare.phone);
        const companyScore = similarity(base.company, compare.company);

        if (
          emailScore > 90 ||
          phoneScore > 90 ||
          companyScore > 85
        ) {
          duplicates.push(compare.id);
        }
      }

      if (duplicates.length > 0) {
        groups.push({
          baseId: base.id,
          duplicates
        });
      }
    }

    return groups;
  }

  async mergeDuplicates(baseId: string, duplicateIds: string[], user: any) {
    const base = await db.lead.findFirst({
      where: { id: baseId, userId: user.id }
    });

    if (!base) throw new Error("Base lead not found");

    const candidates = await db.lead.findMany({
      where: {
        id: { in: [baseId, ...duplicateIds] },
        userId: user.id,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!candidates.length) {
      throw new Error("No duplicate leads found for merge");
    }

    const canonical = candidates.find((item) => item.id === baseId) ?? candidates[0];
    const duplicates = candidates.filter((item) => item.id !== canonical.id);

    if (!duplicates.length) {
      return { mergedInto: canonical.id, removed: [], value: canonical.value };
    }

    const totalValue = candidates.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    const keepEmail = canonical.email || duplicates.find((d) => d.email)?.email || null;
    const keepPhone = canonical.phone || duplicates.find((d) => d.phone)?.phone || null;
    const keepSummary = canonical.summary || duplicates.find((d) => d.summary)?.summary || null;
    const keepNextAction = canonical.nextAction || duplicates.find((d) => d.nextAction)?.nextAction || null;
    const keepInsights = canonical.insights || duplicates.find((d) => d.insights)?.insights || null;
    const keepConfidence = canonical.confidence ?? duplicates.find((d) => d.confidence !== null)?.confidence ?? null;
    const keepPriority = canonical.priority || duplicates.find((d) => d.priority)?.priority || "low";

    const duplicateIdsSafe = duplicates.map((lead) => lead.id);

    await db.$transaction(async (tx) => {
      await tx.activity.updateMany({
        where: { leadId: { in: duplicateIdsSafe }, userId: user.id },
        data: { leadId: canonical.id },
      });

      await tx.payment.updateMany({
        where: { leadId: { in: duplicateIdsSafe }, userId: user.id },
        data: { leadId: canonical.id },
      });

      await tx.invoice.updateMany({
        where: { leadId: { in: duplicateIdsSafe } },
        data: { leadId: canonical.id },
      });

      await tx.meeting.updateMany({
        where: { leadId: { in: duplicateIdsSafe }, userId: user.id },
        data: { leadId: canonical.id },
      });

      await tx.decision.updateMany({
        where: { leadId: { in: duplicateIdsSafe }, userId: user.id },
        data: { leadId: canonical.id },
      });

      await tx.aILog.updateMany({
        where: { leadId: { in: duplicateIdsSafe }, userId: user.id },
        data: { leadId: canonical.id },
      });

      await tx.lead.update({
        where: { id: canonical.id },
        data: {
          value: totalValue,
          email: keepEmail,
          phone: keepPhone,
          summary: keepSummary,
          nextAction: keepNextAction,
          insights: keepInsights,
          confidence: keepConfidence,
          priority: keepPriority,
        },
      });

      await tx.lead.deleteMany({
        where: { id: { in: duplicateIdsSafe }, userId: user.id },
      });
    });

    return {
      mergedInto: canonical.id,
      removed: duplicateIdsSafe,
      value: totalValue,
    };
  }

  async cleanupAll(user: any) {
    const groups = await this.findDuplicates(user);
    let removedCount = 0;
    const merged: Array<{ baseId: string; removed: string[] }> = [];

    for (const group of groups) {
      const baseId = String(group.baseId);
      const duplicateIds: string[] = Array.isArray(group.duplicates)
        ? (Array.from(
            new Set(
              group.duplicates
                .map((id: any) => String(id))
                .filter((id: string) => id && id !== baseId)
            )
          ) as string[])
        : [];

      if (!duplicateIds.length) continue;

      const result = await this.mergeDuplicates(baseId, duplicateIds, user);
      const removed = Array.isArray(result.removed) ? result.removed : [];
      removedCount += removed.length;
      merged.push({ baseId: String(result.mergedInto), removed });
    }

    return {
      groupsProcessed: merged.length,
      removedCount,
      merged,
    };
  }
}