import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
} from 'typeorm';
import {
  IPaginationOptions,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';

export abstract class GenericRepository<T extends ObjectLiteral> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findById(id: number, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as unknown as FindOptionsWhere<T>,
      ...options,
    });
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  async findWithPagination(
    paginationOptions: IPaginationOptions,
    findOptions?: FindManyOptions<T>,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;

    const [items, total] = await this.repository.findAndCount({
      ...findOptions,
      skip,
      take: limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity as T);
    return this.repository.save(newEntity);
  }

  async createMany(entities: Partial<T>[]): Promise<T[]> {
    const newEntities = this.repository.create(entities as T[]);
    return this.repository.save(newEntities);
  }

  async update(id: number, entity: Partial<T>): Promise<T | null> {
    await this.repository.update(id, entity as any);
    return this.findById(id);
  }

  async updateMany(entities: Array<{ id: number } & Partial<T>>): Promise<T[]> {
    const updatePromises = entities.map((entity) =>
      this.update(entity.id, entity),
    );
    const results = await Promise.all(updatePromises);
    return results.filter((item) => item !== null) as T[];
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.repository.softDelete(id);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  getQueryBuilder(alias: string) {
    return this.repository.createQueryBuilder(alias);
  }
}
