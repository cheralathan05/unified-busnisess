import { db } from "../../config/db";

export class LeadRepository {
  // ======================
  // CREATE
  // ======================
  create(data: any) {
    return db.lead.create({ data });
  }

  // ======================
  // FIND ALL (FILTER + PAGINATION)
  // ======================
  findAll(userId: string, filters: any = {}) {
    return db.lead.findMany({
      where: {
        userId,

        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: "insensitive" } },
            { company: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search, mode: "insensitive" } }
          ]
        }),

        ...(filters.stage && { stage: filters.stage }),

        ...(filters.minScore !== undefined ||
        filters.maxScore !== undefined
          ? {
              score: {
                ...(filters.minScore !== undefined && {
                  gte: Number(filters.minScore)
                }),
                ...(filters.maxScore !== undefined && {
                  lte: Number(filters.maxScore)
                })
              }
            }
          : {}),

        ...(filters.minValue !== undefined ||
        filters.maxValue !== undefined
          ? {
              value: {
                ...(filters.minValue !== undefined && {
                  gte: Number(filters.minValue)
                }),
                ...(filters.maxValue !== undefined && {
                  lte: Number(filters.maxValue)
                })
              }
            }
          : {})
      },

      orderBy: { createdAt: "desc" },

      skip: filters.skip,
      take: filters.take
    });
  }

  // ======================
  // COUNT (FOR PAGINATION)
  // ======================
  count(filters: any = {}) {
    return db.lead.count({
      where: filters
    });
  }

  // ======================
  // FIND ONE (USER SAFE)
  // ======================
  findById(id: string, userId: string) {
    return db.lead.findFirst({
      where: { id, userId }
    });
  }

  // ======================
  // UPDATE (USER SAFE)
  // ======================
  async update(id: string, userId: string, data: any) {
    // ensure lead belongs to user
    const existing = await db.lead.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new Error("Lead not found or unauthorized");
    }

    return db.lead.update({
      where: { id },
      data
    });
  }

  // ======================
  // DELETE (USER SAFE)
  // ======================
  async delete(id: string, userId: string) {
    const existing = await db.lead.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      throw new Error("Lead not found or unauthorized");
    }

    return db.lead.delete({
      where: { id }
    });
  }
}