export class BaseService<T = any> {
  protected repository: any;

  constructor(repository: any) {
    this.repository = repository;
  }

  async create(data: Partial<T>) {
    return this.repository.create(data);
  }

  async getById(id: string, userId?: string) {
    const item = await this.repository.findById(id, userId);

    if (!item) {
      throw new Error("Resource not found");
    }

    return item;
  }

  async getAll(filters: any = {}, options: any = {}) {
    return this.repository.findMany(filters, options);
  }

  async update(id: string, data: Partial<T>) {
    return this.repository.update(id, data);
  }

  async delete(id: string) {
    return this.repository.delete(id);
  }

  async count(filters: any = {}) {
    return this.repository.count(filters);
  }
}