# Development Guide

This guide provides a comprehensive overview of the project architecture and step-by-step instructions for implementing new features.

## 1. Architecture Overview

The project follows a modular, layered architecture using NestJS.

### Layers

1.  **Controllers (`src/modules/*/controllers`)**: Handle HTTP requests, validation, and response formatting.
2.  **Services (`src/modules/*/services`)**: Contain business logic. Extend `GenericService` for common CRUD operations.
3.  **Repositories (`src/modules/*/repositories`)**: Handle database interactions. Extend `GenericRepository` for common DB operations. Feature-specific repositories reside within the module.
4.  **Entities (`src/modules/*/entities`)**: Define database schema. Extend `BaseTransactionEntity`. Feature-specific entities reside within the module.
5.  **DTOs (`src/modules/*/dto`)**: Define data transfer objects for validation.

## 2. Directory Structure

```
src/
├── common/             # Shared utilities (decorators, filters, guards, etc.)
├── config/             # Configuration files
├── modules/            # Feature modules (Domain Driven)
│   └── [feature]/
│       ├── controllers/
│       ├── dto/
│       ├── entities/   # Feature-specific entities
│       ├── repositories/ # Feature-specific repositories
│       ├── services/
│       └── [feature].module.ts
└── services/           # Shared services
    └── generic/        # Generic service base
```

## 3. Step-by-Step Feature Implementation

To add a new feature (e.g., `Products`), follow these steps:

### Step 1: Create Entity

Create `src/modules/products/entities/product.entity.ts`:

```typescript
import { Entity, Column } from 'typeorm';
// Import base entity from common
import { BaseTransactionEntity } from '../../../common/entities/base/base-transaction.entity';

@Entity({ name: 'products' })
export class Product extends BaseTransactionEntity {
  @Column()
  name: string;
  // ... other columns
}
```

### Step 2: Create Repository

Create `src/modules/products/repositories/product.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Import generic repository from common/core location
import { GenericRepository } from '../../../repositories/generic/generic.repository';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends GenericRepository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {
    super(repo);
  }
}
```

### Step 3: Create DTOs

Create DTOs in `src/modules/products/dto/`:

- `create-product.dto.ts`
- `update-product.dto.ts`
- `product-response.dto.ts`

### Step 4: Create Service

Create `src/modules/products/services/products.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { GenericService } from '../../../services/generic/generic.service';
import { Product } from '../entities/product.entity';
import { ProductRepository } from '../repositories/product.repository';
// ... import DTOs

@Injectable()
export class ProductsService extends GenericService<
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto
> {
  constructor(private readonly repo: ProductRepository) {
    super(repo, 'Product');
  }

  // Implement abstract methods: toResponseDto, toEntity, findEntityById
}
```

### Step 5: Create Controller

Create `src/modules/products/controllers/products.controller.ts`:

```typescript
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
// ... imports

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  // Implement endpoints using @Get, @Post, etc.
  // Use @ApiResponseWrapper for consistent responses
}
```

### Step 6: Create Module

Create `src/modules/products/products.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsController } from './controllers/products.controller';
import { ProductsService } from './services/products.service';
import { ProductRepository } from './repositories/product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository],
  exports: [ProductsService],
})
export class ProductsModule {}
```

### Step 7: Register Module

Import `ProductsModule` in `src/app.module.ts`.

## 4. Common Patterns & Best Practices

- **Generic Service/Repository**: Always extend these to inherit basic CRUD functionality (pagination, filtering, soft delete).
- **Response Wrapper**: Use `@ApiResponseWrapper` decorator on controller methods to ensure consistent JSON response structure.
- **Validation**: Use `class-validator` decorators in DTOs.
- **Error Handling**: Use `ErrorMessages` constants and throw custom exceptions (e.g., `BusinessValidationException`). The global filter will handle it.
- **Environment Variables**: Access config via `ConfigService`. Ensure new variables are added to `.env.example`.
- **Generic Lookup**: Use the `getLookup` method in GenericService and expose it via a `/lookup` endpoint in your controller to return a lightweight list of entities (id, nameAr, nameEn). Use `BaseLookupDto` for the response.

## 5. Security Standards

The application implements several security best practices by default.

### 5.1. Headers & Helmet

We use `helmet` to set secure HTTP headers. It is enabled globally in `main.ts`.

### 5.2. Rate Limiting

Global rate limiting is configured using `@nestjs/throttler`.

- **Default Limit**: 10 requests per minute (configurable in `AppModule`).
- **Storage**: In-memory by default (consider Redis for multi-instance deployments).

### 5.3. API Versioning

URI versioning is enabled. All endpoints must be accessed via `/api/v1/...`.

- **Default**: `v1`
- **Config**: Set in `main.ts`.

## 6. Error Handling Standards

We use a centralized error handling approach to ensure consistency across the application.

### 5.1. Define Error Messages

All error messages should be defined in `src/common/constants/error-messages.constants.ts`.

```typescript
export const ErrorMessages = {
  // ...
  UserNotFound: {
    key: 'AUTH_USER_NOT_FOUND',
    message: 'User not found.',
  },
  // ...
};
```

### 5.2. Throw Exceptions

Use the custom exception classes in `src/common/exceptions/` and pass the ErrorMessage object.

- **BusinessValidationException**: For logic validation errors (HTTP 400).
- **ConflictException**: For resource conflicts, e.g., duplicate unique fields (HTTP 409).
- **NotFoundException**: For missing resources (HTTP 404).
- **ForbiddenException**: For permission issues (HTTP 403).

**Example:**

```typescript
import { ErrorMessages } from '../../../common/constants/error-messages.constants';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';

// ...

if (skuExists) {
  throw new BusinessValidationException(ErrorMessages.SkuAlreadyExists);
}
```

## 6. Troubleshooting

- **Database Connection**: Check `.env` credentials. Ensure PostgreSQL is running.
- **Missing Config**: If you see "Configuration key ... does not exist", check your `.env` file against `.env.example`.

## 7. Authentication & Authorization

The system implements JWT-based authentication and Role-Based Access Control (RBAC).

### 7.1. User Roles

Defined in `src/common/enums/roles.enum.ts`:

- **OWNER**: Super admin, full access. Can register other users.
- **ADMIN**: Administrative access (Orders, Inventory, Dashboard).
- **MANAGER**: Operations focus (Prep, Packaging).
- **DELIVERY_DRIVER**: Delivery management.

### 7.2. Authentication Flow

- **Login**: `POST /auth/login`
  - Body: `{ "username": "...", "password": "..." }`
  - Response: Access Token (Cookie/Body), Refresh Token (Cookie/Body), User Details.
- **Register**: `POST /auth/register` (Protected: Owner only)
  - Body: `RegisterDto` (includes `username`, `email`, `role`, etc.)
- **Refresh**: `POST /auth/refresh` (Uses Refresh Token cookie)
- **Profile**: `GET /auth/profile` (Returns current user info)

### 7.3. Token Payload

Access tokens contain the following claims:

```json
{
  "sub": 123, // User ID
  "username": "user1", // Username
  "email": "u@ex.com", // Email
  "role": "MANAGER" // User Role
}
```

### 7.4. Protecting Routes

Use the `@Roles` decorator combined with `RolesGuard` and `JwtAuthGuard`.

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.Admin, RoleEnum.Manager)
@Get('secure-resource')
findAll() {
  // ...
}
```
