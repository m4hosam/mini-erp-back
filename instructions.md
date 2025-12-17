# AI Agent Service Development Guide for NestJS PostgreSQL ERP System

## Overview

This guide provides detailed instructions for an AI agent to create new services in a NestJS TypeScript ERP system using a modular clean architecture with Generic Repository and Generic Service patterns. The system follows Domain-Driven Design principles with strict separation of concerns.

## Architecture Overview

The system is structured into modular layers:

- **Entities** (`src/entities`): TypeORM entities (database models)
- **DTOs** (`src/modules/{module}/dto`): Data Transfer Objects for API requests/responses
- **Repositories** (`src/repositories`): Generic and specific data access layer
- **Services** (`src/modules/{module}/services`): Business logic layer
- **Controllers** (`src/modules/{module}/controllers`): HTTP endpoint handlers
- **Filters** (`src/common/filters`): Global exception handling
- **Guards** (`src/common/guards`): Authentication and authorization
- **Interceptors** (`src/common/interceptors`): Response transformation

## Prerequisites for AI Agent

Before creating a new service, ensure you understand:

- The entity uses TypeORM decorators and extends base entity
- The service uses Generic Repository and Generic Service patterns
- All errors return **localization keys** (e.g., `USER_NOT_FOUND`), not hardcoded messages
- JWT authentication with access/refresh token rotation
- Global exception filter handles all errors consistently

## Step-by-Step Service Creation Process

### Step 1: Analyze Entity Requirements

Before starting, identify:

- Entity name and properties
- Business operations required (CRUD + custom operations)
- Relationships with other entities
- Schema location (e.g., "lookup", "business", "transaction")
- Special lookup or projection requirements

### Step 2: Create Entity Model (Entities Layer)

**Location**: `src/entities/{schema}/{entity-name}.entity.ts`

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseTransactionEntity } from '../base/base-transaction.entity';
import { RelatedEntity } from './related-entity.entity';

@Entity({ name: 'entity_name', schema: 'schema_name' })
@Index(['name']) // Add indexes for frequently queried columns
export class EntityName extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  // Foreign key following pattern: fk_{related_entity}_id
  @Column({ name: 'fk_related_entity_id', type: 'int', nullable: false })
  fkRelatedEntityId: number;

  // Many-to-One relationship
  @ManyToOne(() => RelatedEntity, (related) => related.entityNames, {
    onDelete: 'RESTRICT', // Prevent cascade deletes by default
    nullable: false,
  })
  @JoinColumn({ name: 'fk_related_entity_id' })
  relatedEntity: RelatedEntity;

  // One-to-Many relationship
  @OneToMany(() => ChildEntity, (child) => child.parentEntity)
  childEntities: ChildEntity[];
}
```

**Key Points for AI Agent**:

- Always extend `BaseTransactionEntity` for audit fields (createdAt, updatedAt, createdBy, updatedBy)
- Use `@Entity({ name: 'table_name', schema: 'schema_name' })` decorator
- Foreign keys follow pattern `fk_{entity}_id` (snake_case)
- Use appropriate TypeORM decorators for validation
- Set `onDelete: 'RESTRICT'` to prevent accidental data loss
- Add indexes on frequently queried columns
- Column names use snake_case, property names use camelCase

### Step 3: Create Base Transaction Entity

**Location**: `src/entities/base/base-transaction.entity.ts`

```typescript
import {
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export abstract class BaseTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy?: number;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy?: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updater?: User;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
```

### Step 4: Create Data Transfer Objects (DTOs)

**Location**: `src/modules/{module}/dto/`

#### Create DTO

```typescript
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEntityDto {
  @ApiProperty({
    description: 'Entity name',
    example: 'Sample Entity',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'ENTITY_NAME_REQUIRED' }) // Return localization key
  @MaxLength(100, { message: 'ENTITY_NAME_TOO_LONG' })
  name: string;

  @ApiProperty({
    description: 'Entity description',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: 'ENTITY_DESCRIPTION_TOO_LONG' })
  description?: string;

  @ApiProperty({
    description: 'Related entity ID',
    example: 1,
  })
  @IsInt({ message: 'RELATED_ENTITY_ID_MUST_BE_NUMBER' })
  @IsNotEmpty({ message: 'RELATED_ENTITY_ID_REQUIRED' })
  @Type(() => Number)
  fkRelatedEntityId: number;
}
```

#### Update DTO

```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateEntityDto } from './create-entity.dto';
import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEntityDto extends PartialType(CreateEntityDto) {
  @ApiProperty({ description: 'Entity ID to update' })
  @IsInt({ message: 'ENTITY_ID_MUST_BE_NUMBER' })
  @IsNotEmpty({ message: 'ENTITY_ID_REQUIRED' })
  id: number;
}
```

#### Response DTO

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class EntityResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  fkRelatedEntityId: number;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  isActive: boolean;
}
```

#### Lookup DTO

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EntityLookupDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;
}
```

#### Filter Parameters DTO

```typescript
import { IsOptional, IsString, IsInt, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';

export class EntityFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({ description: 'Filter by name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Filter by related entity ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  fkRelatedEntityId?: number;

  @ApiPropertyOptional({ description: 'Filter from date' })
  @IsOptional()
  @IsDateString({}, { message: 'INVALID_DATE_FORMAT' })
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter to date' })
  @IsOptional()
  @IsDateString({}, { message: 'INVALID_DATE_FORMAT' })
  dateTo?: string;
}
```

#### Base Filter DTO

**Location**: `src/common/dto/base-filter.dto.ts`

```typescript
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BaseFilterDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort field', default: 'id' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Schema name' })
  @IsOptional()
  @IsString()
  schema?: string;
}
```

**Key Points for AI Agent**:

- Use `class-validator` decorators for validation
- **All validation messages MUST be localization keys** (e.g., `ENTITY_NAME_REQUIRED`)
- Use `@ApiProperty()` for Swagger documentation
- Create DTO extends `PartialType(CreateDto)` for updates
- Response DTOs use `@Expose()` for serialization control
- Filter DTOs extend `BaseFilterDto` for pagination

### Step 5: Create Generic Repository

**Location**: `src/repositories/generic/generic.repository.ts`

```typescript
import {
  Repository,
  FindOptionsWhere,
  FindManyOptions,
  FindOneOptions,
} from 'typeorm';
import {
  IPaginationOptions,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';

export abstract class GenericRepository<T> {
  constructor(protected readonly repository: Repository<T>) {}

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findById(id: number, options?: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
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

    const [data, total] = await this.repository.findAndCount({
      ...findOptions,
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(entity: Partial<T>): Promise<T> {
    const newEntity = this.repository.create(entity);
    return this.repository.save(newEntity);
  }

  async createMany(entities: Partial<T>[]): Promise<T[]> {
    const newEntities = this.repository.create(entities);
    return this.repository.save(newEntities);
  }

  async update(id: number, entity: Partial<T>): Promise<T> {
    await this.repository.update(id, entity as any);
    return this.findById(id);
  }

  async updateMany(entities: Array<{ id: number } & Partial<T>>): Promise<T[]> {
    const updatePromises = entities.map((entity) =>
      this.update(entity.id, entity),
    );
    return Promise.all(updatePromises);
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
```

### Step 6: Create Specific Repository

**Location**: `src/repositories/{module}/{entity}.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../generic/generic.repository';
import { EntityName } from '../../entities/{schema}/entity-name.entity';
import { EntityLookupDto } from '../../modules/{module}/dto/entity-lookup.dto';

@Injectable()
export class EntityRepository extends GenericRepository<EntityName> {
  constructor(
    @InjectRepository(EntityName)
    private readonly entityRepository: Repository<EntityName>,
  ) {
    super(entityRepository);
  }

  async findAllAsLookup(): Promise<EntityLookupDto[]> {
    return this.entityRepository
      .createQueryBuilder('entity')
      .select(['entity.id', 'entity.name', 'entity.description'])
      .where('entity.isActive = :isActive', { isActive: true })
      .orderBy('entity.name', 'ASC')
      .getMany();
  }

  async findByName(name: string): Promise<EntityName | null> {
    return this.entityRepository.findOne({
      where: { name },
      relations: ['relatedEntity'], // Include related entities if needed
    });
  }

  async findActiveEntities(): Promise<EntityName[]> {
    return this.entityRepository.find({
      where: { isActive: true },
      relations: ['relatedEntity'],
      order: { createdAt: 'DESC' },
    });
  }
}
```

**Key Points for AI Agent**:

- Extend `GenericRepository<EntityType>`
- Use `@Injectable()` decorator
- Inject TypeORM repository with `@InjectRepository()`
- Add custom query methods using QueryBuilder
- Use relations array to load related entities

### Step 7: Create Generic Service

**Location**: `src/services/generic/generic.service.ts`

```typescript
import { GenericRepository } from '../../repositories/generic/generic.repository';
import {
  IPaginationOptions,
  PaginatedResult,
} from '../../common/interfaces/pagination.interface';
import { FindManyOptions } from 'typeorm';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import { ConflictException } from '../../common/exceptions/conflict.exception';

export abstract class GenericService<T, CreateDto, UpdateDto, ResponseDto> {
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
      data: result.data.map((entity) => this.toResponseDto(entity)),
      meta: result.meta,
    };
  }

  async findById(id: number): Promise<ResponseDto> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    return this.toResponseDto(entity);
  }

  async create(dto: CreateDto, userId?: number): Promise<ResponseDto> {
    const entityData = this.toEntity(dto);

    if (userId) {
      entityData['createdBy'] = userId;
    }

    const entity = await this.repository.create(entityData);
    return this.toResponseDto(entity);
  }

  async createMany(dtos: CreateDto[], userId?: number): Promise<ResponseDto[]> {
    const entitiesData = dtos.map((dto) => {
      const entityData = this.toEntity(dto);
      if (userId) {
        entityData['createdBy'] = userId;
      }
      return entityData;
    });

    const entities = await this.repository.createMany(entitiesData);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  async update(dto: UpdateDto, userId?: number): Promise<ResponseDto> {
    const id = dto['id'];

    if (!id) {
      throw new NotFoundException(
        `${this.entityName.toUpperCase()}_ID_REQUIRED`,
      );
    }

    const existingEntity = await this.repository.findById(id);

    if (!existingEntity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    const entityData = this.toEntity(dto);

    if (userId) {
      entityData['updatedBy'] = userId;
    }

    const updatedEntity = await this.repository.update(id, entityData);
    return this.toResponseDto(updatedEntity);
  }

  async updateMany(dtos: UpdateDto[], userId?: number): Promise<ResponseDto[]> {
    const entitiesData = dtos.map((dto) => {
      const entityData = this.toEntity(dto);
      if (userId) {
        entityData['updatedBy'] = userId;
      }
      return { id: dto['id'], ...entityData };
    });

    const entities = await this.repository.updateMany(entitiesData);
    return entities.map((entity) => this.toResponseDto(entity));
  }

  async delete(id: number): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    await this.repository.delete(id);
  }

  async softDelete(id: number, userId?: number): Promise<void> {
    const entity = await this.repository.findById(id);

    if (!entity) {
      throw new NotFoundException(`${this.entityName.toUpperCase()}_NOT_FOUND`);
    }

    await this.repository.update(id, {
      isActive: false,
      updatedBy: userId,
    } as any);
  }
}
```

### Step 8: Create Specific Service

**Location**: `src/modules/{module}/services/entity.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { GenericService } from '../../../services/generic/generic.service';
import { EntityName } from '../../../entities/{schema}/entity-name.entity';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';
import { EntityResponseDto } from '../dto/entity-response.dto';
import { EntityLookupDto } from '../dto/entity-lookup.dto';
import { EntityRepository } from '../../../repositories/{module}/entity.repository';
import { plainToInstance } from 'class-transformer';
import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';

@Injectable()
export class EntityService extends GenericService<
  EntityName,
  CreateEntityDto,
  UpdateEntityDto,
  EntityResponseDto
> {
  constructor(private readonly entityRepository: EntityRepository) {
    super(entityRepository, 'Entity');
  }

  toResponseDto(entity: EntityName): EntityResponseDto {
    return plainToInstance(EntityResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  toEntity(dto: CreateEntityDto | UpdateEntityDto): Partial<EntityName> {
    return {
      name: dto.name,
      description: dto.description,
      fkRelatedEntityId: dto.fkRelatedEntityId,
    };
  }

  async findAllAsLookup(): Promise<EntityLookupDto[]> {
    return this.entityRepository.findAllAsLookup();
  }

  async findByName(name: string): Promise<EntityResponseDto> {
    if (!name || name.trim() === '') {
      throw new BusinessValidationException('ENTITY_NAME_REQUIRED');
    }

    const entity = await this.entityRepository.findByName(name);

    if (!entity) {
      throw new NotFoundException('ENTITY_NOT_FOUND');
    }

    return this.toResponseDto(entity);
  }

  async findActiveEntities(): Promise<EntityResponseDto[]> {
    const entities = await this.entityRepository.findActiveEntities();
    return entities.map((entity) => this.toResponseDto(entity));
  }

  // Override create to add custom validation
  async create(
    dto: CreateEntityDto,
    userId?: number,
  ): Promise<EntityResponseDto> {
    // Check for duplicates
    const existingEntity = await this.entityRepository.findByName(dto.name);

    if (existingEntity) {
      throw new BusinessValidationException('ENTITY_ALREADY_EXISTS');
    }

    return super.create(dto, userId);
  }
}
```

**Key Points for AI Agent**:

- Extend `GenericService<Entity, CreateDto, UpdateDto, ResponseDto>`
- Use `@Injectable()` decorator
- Implement `toResponseDto()` and `toEntity()` abstract methods
- Use `plainToInstance()` for DTO mapping with `excludeExtraneousValues: true`
- Throw exceptions with **localization keys only**
- Add custom business logic methods
- Override base methods for custom validation

### Step 9: Create Controller

**Location**: `src/modules/{module}/controllers/entity.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { EntityService } from '../services/entity.service';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';
import { EntityResponseDto } from '../dto/entity-response.dto';
import { EntityLookupDto } from '../dto/entity-lookup.dto';
import { EntityFilterDto } from '../dto/entity-filter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@ApiTags('Entities')
@Controller('entities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EntityController {
  constructor(private readonly entityService: EntityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all entities with pagination' })
  @ApiResponseWrapper(EntityResponseDto, true, true)
  async findAll(
    @Query() filterDto: EntityFilterDto,
  ): Promise<PaginatedResult<EntityResponseDto>> {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;

    return this.entityService.findWithPagination(
      { page, limit },
      {
        where: filters as any,
        order: { [sortBy]: sortOrder },
        relations: ['relatedEntity'],
      },
    );
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Get entities as lookup (dropdown data)' })
  @ApiResponseWrapper(EntityLookupDto, true)
  async findAllAsLookup(): Promise<EntityLookupDto[]> {
    return this.entityService.findAllAsLookup();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Entity ID' })
  @ApiResponseWrapper(EntityResponseDto)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EntityResponseDto> {
    return this.entityService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Create new entity' })
  @ApiResponseWrapper(EntityResponseDto)
  async create(
    @Body() createDto: CreateEntityDto,
    @Req() req: any,
  ): Promise<EntityResponseDto> {
    const userId = req.user?.id;
    return this.entityService.create(createDto, userId);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create multiple entities' })
  @ApiResponseWrapper(EntityResponseDto, true)
  async createMany(
    @Body() createDtos: CreateEntityDto[],
    @Req() req: any,
  ): Promise<EntityResponseDto[]> {
    const userId = req.user?.id;
    return this.entityService.createMany(createDtos, userId);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponseWrapper(EntityResponseDto)
  async update(
    @Body() updateDto: UpdateEntityDto,
    @Req() req: any,
  ): Promise<EntityResponseDto> {
    const userId = req.user?.id;
    return this.entityService.update(updateDto, userId);
  }

  @Put('bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update multiple entities' })
  @ApiResponseWrapper(EntityResponseDto, true)
  async updateMany(
    @Body() updateDtos: UpdateEntityDto[],
    @Req() req: any,
  ): Promise<EntityResponseDto[]> {
    const userId = req.user?.id;
    return this.entityService.updateMany(updateDtos, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete entity' })
  @ApiResponse({ status: 204, description: 'Entity deleted successfully' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.entityService.delete(id);
  }

  @Delete(':id/soft')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Soft delete entity (set inactive)' })
  @ApiResponse({ status: 204, description: 'Entity deactivated successfully' })
  async softDelete(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<void> {
    const userId = req.user?.id;
    return this.entityService.softDelete(id, userId);
  }
}
```

**Key Points for AI Agent**:

- Use `@Controller('route')` with lowercase, plural routes
- Add `@ApiTags()` for Swagger grouping
- Use `@UseGuards(JwtAuthGuard)` for authentication
- Use `@Roles()` decorator for role-based authorization
- Add `@ApiBearerAuth()` for Swagger JWT documentation
- Extract user ID from request object (`req.user.id`)
- Use custom `@ApiResponseWrapper()` decorator for consistent responses
- Use `ParseIntPipe` for automatic ID validation

### Step 10: Create Module

**Location**: `src/modules/{module}/entity.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntityName } from '../../entities/{schema}/entity-name.entity';
import { EntityController } from './controllers/entity.controller';
import { EntityService } from './services/entity.service';
import { EntityRepository } from '../../repositories/{module}/entity.repository';

@Module({
  imports: [TypeOrmModule.forFeature([EntityName])],
  controllers: [EntityController],
  providers: [EntityService, EntityRepository],
  exports: [EntityService, EntityRepository],
})
export class EntityModule {}
```

**Key Points for AI Agent**:

- Import entity with `TypeOrmModule.forFeature([])`
- Register controllers in `controllers` array
- Register services and repositories in `providers` array
- Export services/repositories if they need to be used by other modules

### Step 11: Create Global Exception Filter

**Location**: `src/common/filters/all-exceptions.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

export interface ErrorResponse {
  statusCode: number;
  error: string;
  messageKey: string;
  details?: any;
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let messageKey = 'INTERNAL_SERVER_ERROR';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        'messageKey' in exceptionResponse
      ) {
        messageKey = (exceptionResponse as any).messageKey;
        details = (exceptionResponse as any).details;
      } else if (typeof exceptionResponse === 'string') {
        messageKey = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        // Handle class-validator errors
        const messages = (exceptionResponse as any).message;
        if (Array.isArray(messages) && messages.length > 0) {
          messageKey = messages[0]; // Use first validation error as key
          details = { validationErrors: messages };
        } else {
          messageKey = messages;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
      messageKey = 'INTERNAL_SERVER_ERROR';
      details =
        process.env.NODE_ENV === 'development'
          ? {
              message: exception.message,
              stack: exception.stack,
            }
          : undefined;
    }

    const errorResponse: ErrorResponse = {
      statusCode,
      error: HttpStatus[statusCode] || 'Internal Server Error',
      messageKey,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url} - Status: ${statusCode} - MessageKey: ${messageKey}`,
    );

    response.status(statusCode).json(errorResponse);
  }
}
```

### Step 12: Create Custom Exceptions

**Location**: `src/common/exceptions/`

#### Not Found Exception

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundException extends HttpException {
  constructor(messageKey: string, details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
```

#### Business Validation Exception

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessValidationException extends HttpException {
  constructor(messageKey: string, details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
```

#### Conflict Exception

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class ConflictException extends HttpException {
  constructor(messageKey: string, details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.CONFLICT,
    );
  }
}
```

#### Forbidden Exception

```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

export class ForbiddenException extends HttpException {
  constructor(messageKey: string = 'INSUFFICIENT_PERMISSIONS', details?: any) {
    super(
      {
        messageKey,
        details,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}
```

### Step 13: Create Response Interceptor

**Location**: `src/common/interceptors/response.interceptor.ts`

```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  messageKey?: string;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
```

### Step 14: Create JWT Authentication Strategy

**Location**: `src/modules/auth/strategies/jwt.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';

export interface JwtPayload {
  sub: number;
  username: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('USER_INACTIVE');
    }

    return {
      id: payload.sub,
      username: payload.username,
      roles: payload.roles,
    };
  }
}
```

### Step 15: Create Refresh Token Strategy

**Location**: `src/modules/auth/strategies/refresh-token.strategy.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();

    if (!refreshToken) {
      throw new UnauthorizedException('REFRESH_TOKEN_REQUIRED');
    }

    return {
      id: payload.sub,
      username: payload.username,
      refreshToken,
    };
  }
}
```

### Step 16: Create Auth Service

**Location**: `src/modules/auth/services/auth.service.ts`

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { TokensDto } from '../dto/tokens.dto';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokensDto> {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('USER_INACTIVE');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.username,
      user.roles,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async refreshTokens(
    userId: number,
    refreshToken: string,
  ): Promise<TokensDto> {
    const user = await this.usersService.findById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('INVALID_REFRESH_TOKEN');
    }

    const tokens = await this.generateTokens(
      user.id,
      user.username,
      user.roles,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(
    userId: number,
    username: string,
    roles: string[],
  ): Promise<TokensDto> {
    const payload = { sub: userId, username, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRATION',
          '15m',
        ),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION',
          '7d',
        ),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }
}
```

### Step 17: Create Guards

**Location**: `src/common/guards/jwt-auth.guard.ts`

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

**Location**: `src/common/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ForbiddenException } from '../exceptions/forbidden.exception';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.roles) {
      throw new ForbiddenException('INSUFFICIENT_PERMISSIONS');
    }

    const hasRole = requiredRoles.some((role) => user.roles?.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('INSUFFICIENT_PERMISSIONS');
    }

    return true;
  }
}
```

### Step 18: Create Decorators

**Location**: `src/common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

**Location**: `src/common/decorators/public.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

**Location**: `src/common/decorators/api-response.decorator.ts`

```typescript
import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiResponseWrapper = <TModel extends Type<any>>(
  model: TModel,
  isArray = false,
  isPaginated = false,
) => {
  if (isPaginated) {
    return applyDecorators(
      ApiOkResponse({
        schema: {
          allOf: [
            {
              properties: {
                success: { type: 'boolean', example: true },
                data: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'array',
                      items: { $ref: getSchemaPath(model) },
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'number' },
                        limit: { type: 'number' },
                        total: { type: 'number' },
                        totalPages: { type: 'number' },
                      },
                    },
                  },
                },
                timestamp: { type: 'string', format: 'date-time' },
              },
            },
          ],
        },
      }),
    );
  }

  return applyDecorators(
    ApiOkResponse({
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: isArray
                ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                : { $ref: getSchemaPath(model) },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        ],
      },
    }),
  );
};
```

### Step 19: Create Pagination Interface

**Location**: `src/common/interfaces/pagination.interface.ts`

```typescript
export interface IPaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
```

### Step 20: Configure Main Application

**Location**: `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for extra properties
      transform: true, // Auto transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('NestJS ERP API')
    .setDescription('The NestJS ERP API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Entities', 'Entity management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
```

## Complete Example: Book Service

Here's how the complete structure looks for a "Book" entity:

### Entity

```typescript
@Entity({ name: 'book', schema: 'library' })
export class Book extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 200, nullable: false })
  title: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  author: string;

  @Column({ name: 'fk_category_id', type: 'int', nullable: false })
  fkCategoryId: number;

  @ManyToOne(() => Category, (category) => category.books, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'fk_category_id' })
  category: Category;
}
```

### DTOs

```typescript
// create-book.dto.ts
export class CreateBookDto {
  @IsString()
  @IsNotEmpty({ message: 'BOOK_TITLE_REQUIRED' })
  @MaxLength(200, { message: 'BOOK_TITLE_TOO_LONG' })
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'BOOK_AUTHOR_TOO_LONG' })
  author?: string;

  @IsInt({ message: 'CATEGORY_ID_MUST_BE_NUMBER' })
  @IsNotEmpty({ message: 'CATEGORY_ID_REQUIRED' })
  fkCategoryId: number;
}

// book-response.dto.ts
export class BookResponseDto {
  @Expose() id: number;
  @Expose() title: string;
  @Expose() author: string;
  @Expose() fkCategoryId: number;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;
}
```

### Repository

```typescript
@Injectable()
export class BookRepository extends GenericRepository<Book> {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {
    super(bookRepository);
  }

  async findByAuthor(author: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: { author, isActive: true },
      relations: ['category'],
      order: { title: 'ASC' },
    });
  }
}
```

### Service

```typescript
@Injectable()
export class BookService extends GenericService<
  Book,
  CreateBookDto,
  UpdateBookDto,
  BookResponseDto
> {
  constructor(private readonly bookRepository: BookRepository) {
    super(bookRepository, 'Book');
  }

  toResponseDto(book: Book): BookResponseDto {
    return plainToInstance(BookResponseDto, book, {
      excludeExtraneousValues: true,
    });
  }

  toEntity(dto: CreateBookDto | UpdateBookDto): Partial<Book> {
    return {
      title: dto.title,
      author: dto.author,
      fkCategoryId: dto.fkCategoryId,
    };
  }

  async findByAuthor(author: string): Promise<BookResponseDto[]> {
    if (!author) {
      throw new BusinessValidationException('AUTHOR_REQUIRED');
    }

    const books = await this.bookRepository.findByAuthor(author);
    return books.map((book) => this.toResponseDto(book));
  }
}
```

### Controller

```typescript
@ApiTags('Books')
@Controller('books')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Get()
  @ApiOperation({ summary: 'Get all books with pagination' })
  @ApiResponseWrapper(BookResponseDto, true, true)
  async findAll(@Query() filterDto: BookFilterDto) {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;
    return this.bookService.findWithPagination(
      { page, limit },
      { where: filters as any, order: { [sortBy]: sortOrder } },
    );
  }

  @Get('by-author/:author')
  @ApiOperation({ summary: 'Get books by author' })
  @ApiResponseWrapper(BookResponseDto, true)
  async findByAuthor(@Param('author') author: string) {
    return this.bookService.findByAuthor(author);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'librarian')
  @ApiOperation({ summary: 'Create new book' })
  @ApiResponseWrapper(BookResponseDto)
  async create(@Body() createDto: CreateBookDto, @Req() req: any) {
    return this.bookService.create(createDto, req.user?.id);
  }
}
```

## Environment Configuration

**Location**: `.env`

```env
# Application
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=erp_database

# JWT
JWT_ACCESS_SECRET=your_access_secret_key_here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_SECRET=your_refresh_secret_key_here
JWT_REFRESH_EXPIRATION=7d

# Logging
LOG_LEVEL=debug
```

## Validation Checklist for AI Agent

Before completing any service implementation, verify:

- [ ] Entity extends `BaseTransactionEntity`
- [ ] Service extends `GenericService` with correct generic parameters
- [ ] Repository extends `GenericRepository`
- [ ] Controller uses `@UseGuards(JwtAuthGuard)`
- [ ] All async methods have "Async" suffix
- [ ] **All error messages are localization keys (UPPERCASE_SNAKE_CASE)**
- [ ] DTOs use `class-validator` decorators
- [ ] Response DTOs use `@Expose()` decorator
- [ ] Service is registered in module providers
- [ ] Entity is imported in `TypeOrmModule.forFeature([])`
- [ ] Authorization attributes (`@Roles()`) are applied where needed
- [ ] Foreign key properties follow `fk_{entity}_id` pattern
- [ ] Swagger decorators are properly configured
- [ ] Column names use snake_case, properties use camelCase

## Project Structure

```
src/
├── common/
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   ├── public.decorator.ts
│   │   └── api-response.decorator.ts
│   ├── dto/
│   │   └── base-filter.dto.ts
│   ├── exceptions/
│   │   ├── not-found.exception.ts
│   │   ├── business-validation.exception.ts
│   │   ├── conflict.exception.ts
│   │   └── forbidden.exception.ts
│   ├── filters/
│   │   └── all-exceptions.filter.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── interfaces/
│       └── pagination.interface.ts
├── config/
│   └── database.config.ts
├── entities/
│   ├── base/
│   │   └── base-transaction.entity.ts
│   ├── users/
│   │   └── user.entity.ts
│   └── {schema}/
│       └── {entity}.entity.ts
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── services/
│   │   ├── strategies/
│   │   └── auth.module.ts
│   ├── users/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── services/
│   │   └── users.module.ts
│   └── {module}/
│       ├── controllers/
│       ├── dto/
│       ├── services/
│       └── {module}.module.ts
├── repositories/
│   ├── generic/
│   │   └── generic.repository.ts
│   └── {module}/
│       └── {entity}.repository.ts
├── services/
│   └── generic/
│       └── generic.service.ts
├── app.module.ts
└── main.ts
```

## Error Response Format

All errors return this structure:

```json
{
  "data": null,
  "error": {
    "messageKey": "USER_NOT_FOUND",
    "message": "User is Not Found",
    "details": {
      "userId": 123
    }
  }
}
```

## Success Response Format

All successful responses return this structure:

```json
{
  "data": {
    "id": 1,
    "name": "Sample Entity"
  },
  "error": null
}
```

## Paginated Response Format

```json
{
  "data": {
    "list": [
      { "id": 1, "name": "Entity 1" },
      { "id": 2, "name": "Entity 2" }
    ],
    "paginationInfo": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  },
  "error": null
}
```

## Common Localization Keys

```typescript
// Authentication & Authorization
USER_NOT_FOUND
INVALID_CREDENTIALS
USER_INACTIVE
INSUFFICIENT_PERMISSIONS
REFRESH_TOKEN_REQUIRED
INVALID_REFRESH_TOKEN

// Validation
{ENTITY}_NAME_REQUIRED
{ENTITY}_NAME_TOO_LONG
{ENTITY}_ID_REQUIRED
{ENTITY}_ID_MUST_BE_NUMBER
INVALID_DATE_FORMAT

// Business Logic
{ENTITY}_NOT_FOUND
{ENTITY}_ALREADY_EXISTS
{ENTITY}_CANNOT_BE_DELETED
DUPLICATE_{ENTITY}

// System
INTERNAL_SERVER_ERROR
```

## Best Practices Summary

1. **Always use localization keys** - Never hardcode error messages
2. **Use Generic patterns** - Maximize code reusability
3. **Follow TypeScript strict mode** - Enable strict type checking
4. **Implement proper DTOs** - Separate request/response models
5. **Use dependency injection** - Leverage NestJS DI container
6. **Apply guards and decorators** - Secure endpoints properly
7. **Document with Swagger** - Use `@ApiProperty()` decorators
8. **Validate inputs** - Use `class-validator` decorators
9. **Handle errors globally** - Let the exception filter catch all errors
10. **Follow naming conventions** - snake_case for DB, camelCase for TypeScript

This guide ensures consistency, maintainability, and follows NestJS/PostgreSQL best practices for enterprise ERP systems.
