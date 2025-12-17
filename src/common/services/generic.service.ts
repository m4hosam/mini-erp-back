import { GenericRepository } from '../repositories/generic.repository';
import {
  IPaginationOptions,
  PaginatedResult,
} from '../interfaces/pagination.interface';
import { FindManyOptions, ObjectLiteral } from 'typeorm';
import { NotFoundException } from '../exceptions/not-found.exception';

export abstract class GenericService<
  T extends ObjectLiteral,
  CreateDto,
  UpdateDto,
  ResponseDto,
> {
  constructor(
    protected readonly repository: GenericRepository<T>,
    protected readonly entityName: string,
  ) {}

  abstract toResponseDto(entity: T): ResponseDto;
  abstract toEntity(dto: CreateDto | UpdateDto): Partial<T>;

  async findAll(options?: FindManyOptions<T>): Promise<ResponseDto[]> {
    const entities = await this.repository.findAll(options);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  async findWithPagination(
    paginationOptions: IPaginationOptions,
    findOptions?: FindManyOptions<T>,
  ): Promise<PaginatedResult<ResponseDto>> {
    const result = await this.repository.findWithPagination(
      paginationOptions,
      findOptions,
    );

    return {
      items: result.items.map((entity) => this.toResponseDto(entity)),
      meta: result.meta,
    };
  }

  async findById(id: number): Promise<ResponseDto> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException({
        key: `${this.entityName.toUpperCase()}_NOT_FOUND`,
        message: `${this.entityName} not found.`,
      });
    }

    return this.toResponseDto(entity);
  }

  async create(dto: CreateDto, userId?: number): Promise<ResponseDto> {
    const entityData = this.toEntity(dto);

    if (userId) {
      (entityData as any)['createdBy'] = userId;
    }

    const entity = await this.repository.create(entityData);
    return this.toResponseDto(entity);
  }

  async createMany(dtos: CreateDto[], userId?: number): Promise<ResponseDto[]> {
    const entitiesData = dtos.map((dto) => {
      const entityData = this.toEntity(dto);
      if (userId) {
        (entityData as any)['createdBy'] = userId;
      }
      return entityData;
    });

    const entities = await this.repository.createMany(entitiesData);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  async update(dto: UpdateDto, userId?: number): Promise<ResponseDto> {
    const id = (dto as any)['id'];

    if (!id) {
      throw new NotFoundException({
        key: `${this.entityName.toUpperCase()}_ID_REQUIRED`,
        message: `${this.entityName} ID required.`,
      });
    }

    const existingEntity = await this.repository.findById(id);

    if (!existingEntity) {
      throw new NotFoundException({
        key: `${this.entityName.toUpperCase()}_NOT_FOUND`,
        message: `${this.entityName} not found.`,
      });
    }

    const entityData = this.toEntity(dto);

    if (userId) {
      (entityData as any)['updatedBy'] = userId;
    }

    const updatedEntity = await this.repository.update(id, entityData);
    if (!updatedEntity) {
      throw new NotFoundException({
        key: `${this.entityName.toUpperCase()}_NOT_FOUND`,
        message: `${this.entityName} not found.`,
      });
    }
    return this.toResponseDto(updatedEntity);
  }

  async updateMany(dtos: UpdateDto[], userId?: number): Promise<ResponseDto[]> {
    const entitiesData = dtos.map((dto) => {
      const entityData = this.toEntity(dto);
      if (userId) {
        (entityData as any)['updatedBy'] = userId;
      }
      return { id: (dto as any)['id'], ...entityData };
    });

    const entities = await this.repository.updateMany(entitiesData as any);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  async delete(id: number): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException({
        key: `${this.entityName.toUpperCase()}_NOT_FOUND`,
        message: `${this.entityName} not found.`,
      });
    }

    await this.repository.delete(id);
  }

  async softDelete(id: number, userId?: number): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException({
        key: `${this.entityName.toUpperCase()}_NOT_FOUND`,
        message: `${this.entityName} not found.`,
      });
    }

    await this.repository.update(id, {
      isActive: false,
      updatedBy: userId,
    } as any);
  }
}
