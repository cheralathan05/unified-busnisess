import { db } from "../../../config/db";

export class BaseRepository<T = any> {
  protected model: any;

  constructor(model: keyof typeof db) {
    this.model = db[model];
  }

  create(data: Partial<T>) {
    return this.model.create({ data });
  }

  findById(id: string, userId?: string) {
    return this.model.findFirst({
      where: {
        id,
        ...(userId && { userId })
      }
    });
  }

  findMany(filters: any = {}, options: any = {}) {
    return this.model.findMany({
      where: filters,
      ...options
    });
  }

  update(id: string, data: Partial<T>) {
    return this.model.update({
      where: { id },
      data
    });
  }

  delete(id: string) {
    return this.model.delete({
      where: { id }
    });
  }

  count(filters: any = {}) {
    return this.model.count({
      where: filters
    });
  }
}