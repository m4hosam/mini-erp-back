export interface ErrorMessage {
  key: string;
  message: string;
}

export const ErrorMessages = {
  // General
  InternalServerError: {
    key: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error.',
  },
  ValidationError: {
    key: 'VALIDATION_ERROR',
    message: 'Validation failed.',
  },
  Conflict: {
    key: 'CONFLICT_ERROR',
    message: 'Resource conflict.',
  },
  NotFound: {
    key: 'NOT_FOUND',
    message: 'Resource not found.',
  },
  Forbidden: {
    key: 'FORBIDDEN',
    message: 'Access forbidden.',
  },

  // Auth
  UserNotFound: {
    key: 'AUTH_USER_NOT_FOUND',
    message: 'User not found.',
  },
  InvalidCredentials: {
    key: 'INVALID_CREDENTIALS',
    message: 'Invalid credentials.',
  },
  UserInactive: {
    key: 'USER_INACTIVE',
    message: 'User is inactive.',
  },
  InvalidRefreshToken: {
    key: 'INVALID_REFRESH_TOKEN',
    message: 'Invalid refresh token.',
  },

  // Items
  SkuAlreadyExists: {
    key: 'SKU_ALREADY_EXISTS',
    message: 'SKU already exists.',
  },

  // Users
  UsernameAlreadyExists: {
    key: 'USERNAME_ALREADY_EXISTS',
    message: 'Username already exists.',
  },
  EmailAlreadyExists: {
    key: 'EMAIL_ALREADY_EXISTS',
    message: 'Email already exists.',
  },
  InsufficientPermissions: {
    key: 'INSUFFICIENT_PERMISSIONS',
    message: 'Insufficient permissions.',
  },

  // Categories
  CategoryNotFound: {
    key: 'CATEGORY_NOT_FOUND',
    message: 'Category not found.',
  },
  CategoryNameAlreadyExists: {
    key: 'CATEGORY_NAME_ALREADY_EXISTS',
    message: 'Category name already exists.',
  },
  CategorySlugAlreadyExists: {
    key: 'CATEGORY_SLUG_ALREADY_EXISTS',
    message: 'Category slug already exists.',
  },
  ParentCategoryNotFound: {
    key: 'PARENT_CATEGORY_NOT_FOUND',
    message: 'Parent category not found.',
  },

  // Products
  ProductNotFound: {
    key: 'PRODUCT_NOT_FOUND',
    message: 'Product not found.',
  },
  BarcodeAlreadyExists: {
    key: 'BARCODE_ALREADY_EXISTS',
    message: 'Barcode already exists.',
  },
  InsufficientStock: {
    key: 'INSUFFICIENT_STOCK',
    message: 'Insufficient stock for this operation.',
  },
  InvalidStockAdjustment: {
    key: 'INVALID_STOCK_ADJUSTMENT',
    message: 'Invalid stock adjustment type.',
  },
};
