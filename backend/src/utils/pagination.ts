interface PaginationParams {
  page?: number;
  limit?: number;
}

interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export function getPagination(params: PaginationParams): PaginationResult {
  const page = Math.max(Number(params.page) || 1, 1);
  const limit = Math.min(Math.max(Number(params.limit) || 10, 1), 100);

  const skip = (page - 1) * limit;

  return {
    skip,
    take: limit,
    page,
    limit
  };
}

export function getPaginationMeta(
  total: number,
  page: number,
  limit: number
) {
  const pages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  };
}