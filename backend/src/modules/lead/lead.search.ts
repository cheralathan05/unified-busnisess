import { db } from "../../config/db";

interface SearchParams {
  userId: string;
  query?: string;
  stage?: string;
  minScore?: number;
  maxScore?: number;
  minValue?: number;
  maxValue?: number;
  page?: number;
  limit?: number;
}

export async function searchLeads(params: SearchParams) {
  const {
    userId,
    query,
    stage,
    minScore,
    maxScore,
    minValue,
    maxValue,
    page = 1,
    limit = 10
  } = params;

  const skip = (page - 1) * limit;

  const where: any = {
    userId,

    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { company: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } }
      ]
    }),

    ...(stage && { stage }),

    ...(minScore !== undefined || maxScore !== undefined
      ? {
          score: {
            ...(minScore !== undefined && { gte: minScore }),
            ...(maxScore !== undefined && { lte: maxScore })
          }
        }
      : {}),

    ...(minValue !== undefined || maxValue !== undefined
      ? {
          value: {
            ...(minValue !== undefined && { gte: minValue }),
            ...(maxValue !== undefined && { lte: maxValue })
          }
        }
      : {})
  };

  const [data, total] = await Promise.all([
      db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit
    }),

      db.lead.count({ where })
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}