# API Documentation for Mini ERP

This documentation provides details for the authentication, products, categories, and users modules. It is designed to assist in generating frontend code that interacts with these APIs.

## Authentication Mechanism

**Important**: The API uses **HTTP-Only Cookies** for authentication.

- **Access Token**: Stored in `access_token` cookie.
- **Refresh Token**: Stored in `refresh_token` cookie.
- **User Details**: Stored in `user_details` cookie (JSON string, accessible to JS).
- **Client Requirements**: Frontend requests must include `credentials: 'include'` (or `withCredentials: true` in axios) to send cookies.

---

## Generic Response Structure

All API responses follow a strict envelope structure.

### Success Response
Status Code: `200` or `201`
```json
{
  "data": { ... payload ... },
  "error": null
}
```

### Error Response
Status Code: `4xx` or `5xx`
```json
{
  "data": null,
  "error": {
    "messageKey": "ERROR_KEY_STRING",
    "message": "Human readable error message",
    "details": { ... optional validation errors or details ... }
  }
}
```

## Error Handling

The API returns consistent error keys. Use these keys for frontend localization or logic.

### Common Errors
| Key | Default Message |
| :--- | :--- |
| `INTERNAL_SERVER_ERROR` | Internal server error. |
| `VALIDATION_ERROR` | Validation failed. (Check `details` for fields) |
| `CONFLICT_ERROR` | Resource conflict. |
| `NOT_FOUND` | Resource not found. |
| `FORBIDDEN` | Access forbidden. |

### Auth Module Errors
| Key | Default Message |
| :--- | :--- |
| `AUTH_USER_NOT_FOUND` | User not found. |
| `INVALID_CREDENTIALS` | Invalid credentials. |
| `USER_INACTIVE` | User is inactive. |
| `INVALID_REFRESH_TOKEN` | Invalid refresh token. |
| `INSUFFICIENT_PERMISSIONS` | Insufficient permissions. |

### User Module Errors
| Key | Default Message |
| :--- | :--- |
| `USERNAME_ALREADY_EXISTS` | Username already exists. |
| `EMAIL_ALREADY_EXISTS` | Email already exists. |

### Product Module Errors
| Key | Default Message |
| :--- | :--- |
| `PRODUCT_NOT_FOUND` | Product not found. |
| `SKU_ALREADY_EXISTS` | SKU already exists. |
| `BARCODE_ALREADY_EXISTS` | Barcode already exists. |
| `INSUFFICIENT_STOCK` | Insufficient stock for this operation. |
| `INVALID_STOCK_ADJUSTMENT` | Invalid stock adjustment type. |

### Category Module Errors
| Key | Default Message |
| :--- | :--- |
| `CATEGORY_NOT_FOUND` | Category not found. |
| `CATEGORY_SLUG_ALREADY_EXISTS` | Category slug already exists. |
| `PARENT_CATEGORY_NOT_FOUND` | Parent category not found. |

---

## 1. Authentication Module (`/auth`)

### Login
**POST** `/auth/login`
- **Public Endpoint**
- **Request Body** (`LoginDto`):
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
- **Response**:
  - Sets cookies: `access_token`, `refresh_token`, `user_details`.
  - Body:
    ```json
    {
      "message": "Login successful",
      "accessToken": "eyJhbG..."
    }
    ```

### Logout
**POST** `/auth/logout`
- **Requires Auth**
- **Response**:
  - Clears cookies.
  - Body: `{ "message": "Logout successful" }`

### Refresh Token
**POST** `/auth/refresh`
- **Requires Auth** (via `refresh_token` cookie)
- **Response**:
  - Refreshes cookies.
  - Body: `{ "message": "Tokens refreshed" }`

### Get Profile
**GET** `/auth/profile`
- **Requires Auth**
- **Response**:
  ```json
  {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
  ```

---

## 2. Products Module (`/products`)

### Create Product
**POST** `/products`
- **Roles**: OWNER, ADMIN, MANAGER
- **Request Body** (`CreateProductDto`):
  ```json
  {
    "sku": "PRD-001",
    "barcode": "1234567890123", // optional
    "nameAr": "عصير برتقال طازج",
    "nameEn": "Fresh Orange Juice",
    "description": "Freshly squeezed", // optional
    "costPrice": 15.50,
    "salePrice": 25.00,
    "unit": "bottle",
    "categoryId": 1, // optional
    "reorderLevel": 10, // optional
    "imageUrl": "https://example.com/img.jpg", // optional
    "shelfLifeDays": 7, // optional,
    "requiresColdStorage": true // optional
  }
  ```
- **Response**: Returns the created product object.

### Get All Products
**GET** `/products`
- **Query Params**:
  - `page`: number (default 1)
  - `limit`: number (default 10)
  - `categoryId`: number (optional)
  - `search`: string (optional, searches nameAr/nameEn/sku)
  - `status`: string ('LOW_STOCK' | 'OUT_OF_STOCK' | 'IN_STOCK') (optional)
- **Response**:
  ```json
  {
    "data": [ ...product objects... ],
    "meta": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
  ```

### Get Product by ID
**GET** `/products/:id`
- **Response**: Single product object.

### Update Product
**PATCH** `/products/:id`
- **Roles**: OWNER, ADMIN, MANAGER
- **Request Body**: Partial `CreateProductDto`.

### Adjust Stock
**POST** `/products/:id/adjust-stock`
- **Roles**: OWNER, ADMIN, MANAGER
- **Request Body** (`AdjustStockDto`):
  ```json
  {
    "quantity": 50,
    "type": "ADD", // Enum: ADD, REMOVE, SET
    "reason": "Restock",
    "referenceId": "PO-123" // optional
  }
  ```

### Delete Product
**DELETE** `/products/:id`
- **Roles**: OWNER, ADMIN
- **Response**: `{ "message": "Product deleted successfully" }`

---

## 3. Categories Module (`/categories`)

### Create Category
**POST** `/categories`
- **Roles**: OWNER, ADMIN, MANAGER
- **Request Body** (`CreateCategoryDto`):
  ```json
  {
    "nameAr": "مشروبات",
    "nameEn": "Beverages",
    "description": "All drinks", // optional
    "parentId": null // optional number
  }
  ```

### Get All Categories
**GET** `/categories`
- **Query Params**: `page`, `limit`
- **Response**: Paginated list of categories.

### Get Category Tree
**GET** `/categories/tree`
- **Response**: Hierarchical tree structure of categories.

### Update Category
**PATCH** `/categories/:id`
- **Roles**: OWNER, ADMIN, MANAGER
- **Request Body**: Partial `CreateCategoryDto`.

### Delete Category
**DELETE** `/categories/:id`
- **Roles**: OWNER, ADMIN

---

## 4. Users Module (`/users`)

### Create User
**POST** `/users`
- **Roles**: ADMIN
- **Request Body** (`CreateUserDto`):
  ```json
  {
    "email": "user@example.com",
    "username": "user1",
    "password": "secretPassword",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "1234567890", // optional
    "role": "MANAGER" // Enum: OWNER, ADMIN, MANAGER, DELIVERY_DRIVER
  }
  ```

### Get All Users
**GET** `/users`
- **Query Params**: `page`, `limit`, `sortBy`, `sortOrder`, other filters.
- **Response**: Paginated user list.

### Get User by ID
**GET** `/users/:id`
- **Roles**: ADMIN, MANAGER

### Update User
**PUT** `/users`
- **Roles**: ADMIN
- **Request Body**: `UpdateUserDto` (likely includes `id` and partial fields).

### Delete User
**DELETE** `/users/:id`
- **Roles**: ADMIN

---

## Enums

### RoleEnum
- `OWNER`
- `ADMIN`
- `MANAGER`
- `DELIVERY_DRIVER`

### StockAdjustmentType
- `ADD`
- `REMOVE`
- `SET`
