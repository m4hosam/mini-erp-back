**Act as:** An Expert Senior Backend Developer specializing in NestJS, TypeORM, and TypeScript.

**Context:**
I am building a **Mini ERP System for Small Businesses**. I need you to generate the code for the **Inventory Domain**, specifically the **Category** and **Product** modules.

**Tech Stack:**

- Framework: NestJS
- Database: PostgreSQL (via TypeORM)
- Validation: `class-validator` & `class-transformer`
- Documentation: Swagger (`@nestjs/swagger`)
- Common Architecture: Service-Repository pattern with Generic Service base classes.

**Task:**
Please implement the following two modules: `CategoriesModule` and `ProductsModule`. Follow the detailed specifications below.

---

### **1. Category Module (`src/modules/categories`)**

**Goal:** Manage product classifications (e.g., "Fresh Produce", "Dairy").

#### **1.1 Category Entity (`entities/category.entity.ts`)**

```typescript
@Entity({ name: 'categories' })
export class Category extends BaseTransactionEntity {
  @Column({ unique: true })
  name: string; // e.g., "Beverages"

  @Column({ unique: true })
  slug: string; // URL-friendly ID, e.g., "beverages"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  // Self-referencing relation for sub-categories (e.g., Beverages -> Hot Drinks)
  @TreeParent()
  parent: Category;

  @TreeChildren()
  children: Category[];

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
```

#### **1.2 Category Requirements**

- **DTOs:**
- `CreateCategoryDto`: `name` (required), `description`, `parentId` (optional UUID).
- `UpdateCategoryDto`: Partial of Create.

- **Service Logic (`categories.service.ts`):**
- Auto-generate `slug` from `name` (kebab-case) if not provided.
- Validate that `name` is unique.
- Implement `getCategoryTree()` to return categories nested with their children.

- **Controller (`categories.controller.ts`):**
- Standard CRUD endpoints.
- `GET /categories/tree`: Return hierarchical structure.

---

### **2. Product Management Module (`src/modules/products`)**

**Goal:** Manage inventory items, pricing, and stock levels.

#### **2.1 Product Entity (`entities/product.entity.ts`)**

```typescript
@Entity({ name: 'products' })
export class Product extends BaseTransactionEntity {
  @Column({ unique: true })
  sku: string; // Stock Keeping Unit (Internal Code)

  @Column({ nullable: true, unique: true })
  barcode: string; // UPC/EAN for scanning

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number; // Cost of Goods Sold (COGS)

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salePrice: number; // Retail Price

  @Column()
  unit: string; // e.g., "kg", "pcs", "box"

  // Inventory
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  reorderLevel: number; // Threshold for low stock alert

  // Relations
  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  // Specific attributes
  @Column({ type: 'int', nullable: true })
  shelfLifeDays: number;

  @Column({ default: false })
  requiresColdStorage: boolean;
}
```

#### **2.2 DTOs**

- **`create-product.dto.ts`:**
- Required: `sku`, `name`, `costPrice`, `salePrice`, `unit`.
- Optional: `categoryId` (UUID), `barcode`, `reorderLevel`, etc.
- Validation: `salePrice` must be greater than 0.

- **`update-product.dto.ts`:** Partial fields.
- **`product-response.dto.ts`:**
- Include flattened `categoryName` property.
- Computed field `stockStatus`: Returns "OUT_OF_STOCK" (<=0), "LOW_STOCK" (<= reorderLevel), or "IN_STOCK".
- Computed field `margin`: `((salePrice - costPrice) / salePrice) * 100`.

- **`adjust-stock.dto.ts`:**
- Fields: `{ quantity: number, type: 'ADD' | 'REMOVE' | 'SET', reason: string, referenceId?: string }`

#### **2.3 Service Logic (`products.service.ts`)**

- **Dependencies:** Inject `ProductRepository` and `CategoriesService` (to validate categories exist).
- **Custom Methods:**
- `validateUniqueIdentifiers(sku, barcode)`: Ensure no duplicates on create/update.
- `adjustStock(id, dto)`:
- If `type` is 'REMOVE', ensure `currentStock - quantity >= 0`. If not, throw `BadRequestException('Insufficient stock')`.
- Update the `currentStock`.
- _Note to AI:_ In a real app we would create a transaction log here, but for now just update the product entity.

- `getLowStockProducts()`: Query where `currentStock <= reorderLevel`.

#### **2.4 Controller Endpoints (`products.controller.ts`)**

- `POST /products`: Create (Admin/Manager).
- `GET /products`: List with pagination. Support query filters: `?categoryId=...`, `?search=...` (searches name/sku/barcode), `?status=LOW_STOCK`.
- `GET /products/:id`: Get detail.
- `PATCH /products/:id`: Update.
- `POST /products/:id/adjust-stock`: endpoint for inventory changes.
- `DELETE /products/:id`: Soft delete.

#### **2.5 Business Rules & Validations**

1. **SKU & Barcode:** Must be unique globally.
2. **Category Validation:** If a `categoryId` is passed, verify it exists in the database.
3. **Pricing Safety:** Emit a warning log if `salePrice` < `costPrice` (allow it, but log it).
4. **Stock Safety:** Prevent negative stock levels via the `adjustStock` method.

---

### **Output Requirements:**

Please generate the code for:

1. `categories.module.ts`, `entities/category.entity.ts`, `dto/*`, `categories.service.ts`, `categories.controller.ts`
2. `products.module.ts`, `entities/product.entity.ts`, `dto/*`, `products.service.ts`, `products.controller.ts`

Ensure you use proper `@ApiProperty` decorators for Swagger documentation on all DTOs and Entities.

### Key Enhancements Made for Your Mini ERP:

1.  **Relation Strategy**: Changed `category` from a simple string to a **Relation** (`@ManyToOne`). This allows you to filter products by category ID later and rename a category without breaking 1,000 products.
2.  **Hierarchy**: Added `parent/children` to Categories. This allows you to have "Fruits" -> "Berries" structure.
3.  **Barcodes**: Added `barcode` field. Small businesses rely heavily on scanning; SKU is for internal use, Barcode is for the scanner.
4.  **Stock Logic**: Refined `adjust-stock` to include a `SET` type (useful for stocktaking/inventory counts) alongside ADD/REMOVE.
5.  **Profitability**: Added a computed `margin` field in the response. This helps the business owner see profit percentage instantly.
6.  **Searchability**: Requested filters for the list endpoint so the frontend can search by name, SKU, or Barcode easily.
