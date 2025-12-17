# FreshFlow ERP System - Phase 1 & 2 Implementation Guide

## Project Context

You are building "FreshFlow", a web-based ERP system for fresh produce businesses using NestJS, TypeORM, and PostgreSQL. Follow the existing architecture patterns defined in the development guide.

---

## PHASE 1: Foundation & Product/Inventory Management

### Overview
Set up the core foundation including authentication with RBAC and complete product/inventory management with stock tracking.

### Phase 1 Requirements

#### 1.1 Authentication & RBAC Setup

**User Roles to Implement:**
- `OWNER` (Super Admin): Full system access
- `ADMIN`: Order management, inventory, suppliers, dashboards (no profit/loss)
- `MANAGER`: Operations focus - prep, packaging workflow
- `DELIVERY_DRIVER`: View assigned orders only, update delivery status

**Implementation Steps:**

1. **Create User Entity** (`src/modules/users/entities/user.entity.ts`):
   - Extend `BaseTransactionEntity`
   - Fields: `email`, `password` (hashed), `firstName`, `lastName`, `phone`, `role` (enum), `isActive`
   - Add indexes on `email` (unique)

2. **Create Auth Module** with:
   - **DTOs**: `register.dto.ts`, `login.dto.ts`, `auth-response.dto.ts`
   - **Services**: JWT token generation, password hashing (bcrypt), role validation
   - **Controllers**: 
     - `POST /auth/register` - Register new user (Owner only)
     - `POST /auth/login` - Login and return JWT token
     - `GET /auth/profile` - Get current user profile
   - **Guards**: `JwtAuthGuard`, `RolesGuard` (check user roles)
   - **Decorators**: `@Roles(UserRole.OWNER, UserRole.ADMIN)` for role-based access

3. **Security Implementation:**
   - Hash passwords using bcrypt (salt rounds: 10)
   - JWT token expiry: 24 hours
   - Include userId and role in JWT payload

#### 1.2 Product Management Module

**Product Entity** (`src/modules/products/entities/product.entity.ts`):
```typescript
@Entity({ name: 'products' })
export class Product extends BaseTransactionEntity {
  @Column({ unique: true })
  sku: string; // Product code (e.g., "STRAW-PREM-001")
  
  @Column()
  name: string; // "Premium Strawberries"
  
  @Column({ type: 'text', nullable: true })
  description: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number; // COGS - cost to acquire
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salePrice: number; // Price to customer
  
  @Column()
  unit: string; // "kg", "box", "piece"
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStock: number; // Current available quantity
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reorderLevel: number; // Alert when stock falls below this
  
  @Column({ nullable: true })
  category: string; // "Berries", "Citrus", "Tropical"
  
  @Column({ nullable: true })
  imageUrl: string;
  
  @Column({ default: true })
  isActive: boolean;
  
  // Fresh produce specific fields
  @Column({ type: 'int', nullable: true })
  shelfLifeDays: number; // Expected shelf life
  
  @Column({ default: false })
  requiresColdStorage: boolean;
}
```

**DTOs to Create:**
- `create-product.dto.ts`: All fields required except id, timestamps
- `update-product.dto.ts`: Partial update, all fields optional
- `product-response.dto.ts`: Response format with computed fields (stockStatus)
- `adjust-stock.dto.ts`: `{ productId, quantity, type: 'ADD' | 'REMOVE', reason: string }`

**Service Requirements** (`products.service.ts`):
- Extend `GenericService<Product, CreateProductDto, UpdateProductDto, ProductResponseDto>`
- Custom methods:
  - `checkStockAvailability(productId: string, requestedQuantity: number): Promise<boolean>`
  - `adjustStock(adjustStockDto: AdjustStockDto): Promise<Product>`
  - `getLowStockProducts(): Promise<Product[]>` - Products below reorder level
  - `validateUniqueSKU(sku: string, excludeId?: string): Promise<void>` - Throw error if duplicate

**Business Rules:**
- SKU must be unique across all products
- Stock cannot go negative (throw `BusinessValidationException`)
- When stock is adjusted, log the change (keep audit trail in separate table later)
- SalePrice should be greater than CostPrice (validation warning)

**Controller Endpoints** (`products.controller.ts`):
- `POST /products` - Create product (Owner, Admin only)
- `GET /products` - List all products with pagination & filters (All roles)
- `GET /products/:id` - Get single product (All roles)
- `PATCH /products/:id` - Update product (Owner, Admin only)
- `DELETE /products/:id` - Soft delete (Owner only)
- `POST /products/:id/adjust-stock` - Adjust inventory (Owner, Admin only)
- `GET /products/low-stock` - Get products below reorder level (Owner, Admin only)

**Response Format** (use `@ApiResponseWrapper`):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "STRAW-PREM-001",
    "name": "Premium Strawberries",
    "currentStock": 50,
    "stockStatus": "IN_STOCK" // Computed: IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  },
  "message": "Product created successfully"
}
```

**Error Handling:**
- Use `ErrorMessages.SkuAlreadyExists` for duplicate SKU
- Use `ErrorMessages.ProductNotFound` for missing product
- Use `ErrorMessages.InsufficientStock` when trying to remove more than available

#### 1.3 Product Module Setup

**Module** (`products.module.ts`):
- Import `TypeOrmModule.forFeature([Product])`
- Providers: `ProductsService`, `ProductRepository`
- Controllers: `ProductsController`
- Exports: `ProductsService` (for use in other modules)

**Register in App Module:**
- Import `ProductsModule` in `app.module.ts`

---

## PHASE 2: Order Management & Workflow

### Overview
Implement the complete order lifecycle from intake (manual and public form) through state machine workflow to completion.

### Phase 2 Requirements

#### 2.1 Order Entity & Relationships

**Order Entity** (`src/modules/orders/entities/order.entity.ts`):
```typescript
@Entity({ name: 'orders' })
export class Order extends BaseTransactionEntity {
  @Column({ unique: true })
  orderNumber: string; // Auto-generated: "ORD-20241217-001"
  
  // Customer Information
  @Column()
  customerName: string;
  
  @Column()
  customerPhone: string;
  
  @Column({ type: 'text' })
  customerAddress: string;
  
  @Column({ nullable: true })
  customerEmail: string;
  
  // Order Status (State Machine)
  @Column({
    type: 'enum',
    enum: ['RECEIVED', 'SOURCING', 'PREPARING', 'PACKAGING', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'],
    default: 'RECEIVED'
  })
  status: OrderStatus;
  
  // Financial Fields
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSalePrice: number; // Total revenue from customer
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProductCost: number; // Total COGS
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCost: number; // Calculated driver payout
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  miscCost: number; // Packaging, overhead
  
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netProfit: number; // Computed field
  
  // Delivery Information
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  deliveryDistanceKm: number;
  
  @Column({ type: 'timestamp', nullable: true })
  deliveryDate: Date;
  
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User;
  
  @Column({ nullable: true })
  driverId: string;
  
  // Order Items (One-to-Many relationship)
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
  
  // Audit
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;
  
  @Column()
  createdById: string;
  
  @Column({ type: 'text', nullable: true })
  notes: string; // Internal notes
  
  @Column({ default: 'MANUAL' }) // 'MANUAL' or 'PUBLIC_FORM'
  orderSource: string;
}
```

**OrderItem Entity** (`src/modules/orders/entities/order-item.entity.ts`):
```typescript
@Entity({ name: 'order_items' })
export class OrderItem extends BaseTransactionEntity {
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;
  
  @Column()
  orderId: string;
  
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
  
  @Column()
  productId: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number; // Price at time of order
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number; // Cost at time of order
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number; // quantity * unitPrice
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalCost: number; // quantity * unitCost
}
```

#### 2.2 Order DTOs

**create-order.dto.ts**:
```typescript
class CreateOrderItemDto {
  productId: string;
  quantity: number;
}

class CreateOrderDto {
  customerName: string; // @IsNotEmpty()
  customerPhone: string; // @IsNotEmpty()
  customerAddress: string; // @IsNotEmpty()
  customerEmail?: string; // @IsOptional()
  items: CreateOrderItemDto[]; // @IsArray(), @ArrayMinSize(1)
  notes?: string;
  miscCost?: number; // For packaging costs
  orderSource?: 'MANUAL' | 'PUBLIC_FORM'; // Default: MANUAL
}
```

**update-order-status.dto.ts**:
```typescript
class UpdateOrderStatusDto {
  status: OrderStatus; // Must follow state machine rules
  notes?: string;
}
```

**assign-driver.dto.ts**:
```typescript
class AssignDriverDto {
  driverId: string;
  deliveryDistanceKm: number;
}
```

#### 2.3 Order Service Business Logic

**Key Methods** (`orders.service.ts`):

1. **createOrder(createOrderDto, userId)**:
   - Validate all products exist
   - Check stock availability for each item
   - If any product has insufficient stock, set order status to 'SOURCING'
   - Otherwise, set status to 'RECEIVED'
   - Calculate totalSalePrice and totalProductCost from items
   - Generate unique orderNumber (format: ORD-YYYYMMDD-XXX)
   - Reserve stock (reduce currentStock by ordered quantity)
   - Create order with items in a transaction

2. **updateOrderStatus(orderId, updateStatusDto, userId)**:
   - Validate state transition using state machine rules
   - Allowed transitions:
     - RECEIVED → SOURCING, PREPARING, CANCELLED
     - SOURCING → PREPARING, CANCELLED
     - PREPARING → PACKAGING, CANCELLED
     - PACKAGING → OUT_FOR_DELIVERY, CANCELLED
     - OUT_FOR_DELIVERY → COMPLETED, CANCELLED
   - Throw error for invalid transitions
   - Update status and recalculate netProfit if costs changed

3. **assignDriver(orderId, assignDriverDto, userId)**:
   - Validate order is in PACKAGING status
   - Validate driver exists and has DELIVERY_DRIVER role
   - Calculate deliveryCost = deliveryDistanceKm * driver.costPerKm
   - Update order status to OUT_FOR_DELIVERY
   - Assign driver and save delivery details

4. **getOrdersByStatus(status, pagination)**:
   - Filter orders by status with pagination
   - Include order items and product details

5. **calculateOrderFinancials(orderId)**:
   - Recalculate: netProfit = totalSalePrice - (totalProductCost + deliveryCost + miscCost)
   - Update order entity

**Business Rules:**
- Stock is reserved when order is created
- If order is cancelled, release reserved stock back to inventory
- Order number must be unique
- State machine transitions must be validated
- Only PACKAGING orders can be assigned to drivers
- Financial calculations must be accurate and logged

#### 2.4 Order Controller Endpoints

**Controller** (`orders.controller.ts`):
- `POST /orders` - Create manual order (Owner, Admin only)
- `GET /orders` - List orders with filters (status, date range, customer) & pagination
- `GET /orders/:id` - Get single order with items (All authenticated users)
- `PATCH /orders/:id/status` - Update order status (Owner, Admin, Manager)
- `POST /orders/:id/assign-driver` - Assign driver (Owner, Admin only)
- `PATCH /orders/:id` - Update order details (Owner, Admin only)
- `DELETE /orders/:id` - Cancel order (Owner, Admin only)
- `GET /orders/by-status/:status` - Filter by status (Role-based)

**Special Endpoints:**
- `GET /orders/driver/my-orders` - Get driver's assigned orders (Driver only)
- `PATCH /orders/:id/mark-delivered` - Driver marks order as delivered (Driver only)

#### 2.5 Public Order Form (Future Endpoint)

**Controller** (`public-orders.controller.ts`):
- `POST /public/orders` - Create order from public form (No auth required)
- Apply rate limiting (5 requests per minute per IP)
- Validate customer data thoroughly
- Set orderSource as 'PUBLIC_FORM'
- Send confirmation response with order number

---

## State Machine Implementation

**Valid State Transitions:**
```
RECEIVED → [SOURCING, PREPARING, CANCELLED]
SOURCING → [PREPARING, CANCELLED]
PREPARING → [PACKAGING, CANCELLED]
PACKAGING → [OUT_FOR_DELIVERY, CANCELLED]
OUT_FOR_DELIVERY → [COMPLETED, CANCELLED]
COMPLETED → [No transitions]
CANCELLED → [No transitions]
```

**Implementation Approach:**
Create a `OrderStateMachine` class with `canTransition(from, to)` method that validates transitions before updating.

---

## Error Messages to Define

Add to `src/common/constants/error-messages.constants.ts`:
```typescript
OrderNotFound: { key: 'ORDER_NOT_FOUND', message: 'Order not found.' }
InvalidStateTransition: { key: 'INVALID_STATE_TRANSITION', message: 'Cannot transition from {from} to {to}.' }
InsufficientStock: { key: 'INSUFFICIENT_STOCK', message: 'Insufficient stock for product {product}.' }
DriverNotFound: { key: 'DRIVER_NOT_FOUND', message: 'Driver not found.' }
OrderMustBeInPackaging: { key: 'ORDER_MUST_BE_IN_PACKAGING', message: 'Order must be in PACKAGING status to assign driver.' }
```

---

## Database Migrations

After creating entities, generate and run migrations:
```bash
npm run migration:generate -- src/migrations/CreateUsersAndProducts
npm run migration:run

npm run migration:generate -- src/migrations/CreateOrdersAndOrderItems
npm run migration:run
```

---

## Testing Requirements

For each module, create:
1. **Unit Tests**: Service methods with mocked repositories
2. **Integration Tests**: Controller endpoints with test database
3. **Test Cases to Cover**:
   - Successful order creation with stock check
   - Order creation failure (insufficient stock → SOURCING)
   - State transition validation
   - Driver assignment and cost calculation
   - Order cancellation and stock restoration

---

## Module Registration Checklist

**Phase 1:**
- [ ] Create UsersModule with AuthModule
- [ ] Create ProductsModule
- [ ] Register both in AppModule
- [ ] Configure JWT in AuthModule
- [ ] Apply JwtAuthGuard globally (exclude public routes)

**Phase 2:**
- [ ] Create OrdersModule (depends on ProductsModule, UsersModule)
- [ ] Register OrdersModule in AppModule
- [ ] Configure relationships between Order, OrderItem, Product, User entities

---

## Expected Deliverables

### Phase 1:
1. Complete authentication system with JWT and RBAC
2. Full CRUD for products with stock management
3. API endpoints tested and documented
4. Low stock alerts functionality

### Phase 2:
1. Order creation with automatic stock checking
2. Complete state machine for order workflow
3. Driver assignment with cost calculation
4. Order list views filtered by status and role
5. Driver interface to view assigned orders

---

## Architecture Compliance

Ensure all implementations follow the development guide:
- Extend `BaseTransactionEntity` for all entities
- Extend `GenericRepository` for repositories
- Extend `GenericService` for services
- Use `@ApiResponseWrapper` for consistent API responses
- Use custom exceptions with `ErrorMessages` constants
- Apply proper validation with `class-validator` decorators
- Implement proper error handling in all service methods

---

## Next Steps After Phase 2

Once Phase 1 & 2 are complete, you'll have:
- ✅ User authentication and role management
- ✅ Product catalog and inventory tracking
- ✅ Complete order workflow from intake to delivery
- ✅ Basic driver management

This sets the foundation for Phase 3 (Financial Dashboard & Reporting) and Phase 4 (Advanced features like expiry tracking, quality control, etc.).

---

## Questions to Ask Before Starting

1. Should we implement email verification for user registration?
2. What should be the default password policy (minimum length, complexity)?
3. Should drivers see customer phone numbers, or only addresses?
4. Do you want real-time notifications when order status changes?
5. Should there be a maximum order limit for public form orders?

**Start with Phase 1, complete it fully with tests, then move to Phase 2. Good luck! 🚀**