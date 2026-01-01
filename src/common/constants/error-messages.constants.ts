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
  ModifierGroupNotFound: {
    key: 'MODIFIER_GROUP_NOT_FOUND',
    message: 'Modifier group not found.',
  },
  ModifierNotFound: {
    key: 'MODIFIER_NOT_FOUND',
    message: 'Modifier not found.',
  },
  ModifierValidationFailed: {
    key: 'MODIFIER_VALIDATION_FAILED',
    message: 'Modifier selections do not meet requirements.',
  },
  MinSelectionsRequired: {
    key: 'MIN_SELECTIONS_REQUIRED',
    message: 'Minimum selections not met for required modifier group.',
  },
  MaxSelectionsExceeded: {
    key: 'MAX_SELECTIONS_EXCEEDED',
    message: 'Maximum selections exceeded for modifier group.',
  },

  // Customers
  CustomerNotFound: {
    key: 'CUSTOMER_NOT_FOUND',
    message: 'Customer not found.',
  },
  PhoneAlreadyExists: {
    key: 'PHONE_ALREADY_EXISTS',
    message: 'Phone number already exists.',
  },
  InsufficientStoreCredit: {
    key: 'INSUFFICIENT_STORE_CREDIT',
    message: 'Customer does not have enough store credit.',
  },
  InvalidRedemptionAmount: {
    key: 'INVALID_REDEMPTION_AMOUNT',
    message: 'Redemption amount must be multiple of 10 points.',
  },

  // Orders
  OrderNotFound: {
    key: 'ORDER_NOT_FOUND',
    message: 'Order not found.',
  },
  InvalidStateTransition: {
    key: 'INVALID_STATE_TRANSITION',
    message: 'Invalid state transition.',
  },
  ProductUsageNotAllowed: {
    key: 'PRODUCT_USAGE_NOT_ALLOWED',
    message: 'Product is not active or available for sale.',
  },
  PaymentIncomplete: {
    key: 'PAYMENT_INCOMPLETE',
    message: 'Order payment is not complete.',
  },
  InvalidOrderStatus: {
    key: 'INVALID_ORDER_STATUS',
    message: 'Cannot perform this action in current order status.',
  },
  ItemAlreadyFired: {
    key: 'ITEM_ALREADY_FIRED',
    message: 'Cannot modify items after firing to kitchen.',
  },
  InsufficientCredit: {
    key: 'INSUFFICIENT_CREDIT',
    message: 'Insufficient store credit balance.',
  },
  InsufficientLoyaltyPoints: {
    key: 'INSUFFICIENT_LOYALTY_POINTS',
    message: 'Insufficient loyalty points.',
  },
  VoidRequiresAuthorization: {
    key: 'VOID_REQUIRES_AUTHORIZATION',
    message: 'Void operation requires manager authorization.',
  },
  CannotDeleteNonDraftOrder: {
    key: 'CANNOT_DELETE_NON_DRAFT_ORDER',
    message: 'Only draft orders can be deleted.',
  },
  RefundExceedsTotal: {
    key: 'REFUND_EXCEEDS_TOTAL',
    message: 'Refund amount exceeds order total.',
  },
  PaymentExceedsTotal: {
    key: 'PAYMENT_EXCEEDS_TOTAL',
    message: 'Payment amount exceeds order total.',
  },
  CannotRemovePaymentFromCompletedOrder: {
    key: 'CANNOT_REMOVE_PAYMENT_FROM_COMPLETED_ORDER',
    message: 'Cannot remove payment from completed order.',
  },
  OrderItemNotFound: {
    key: 'ORDER_ITEM_NOT_FOUND',
    message: 'Order item not found.',
  },
  PaymentNotFound: {
    key: 'PAYMENT_NOT_FOUND',
    message: 'Payment not found.',
  },

  // Sessions
  SessionAlreadyOpen: {
    key: 'SESSION_ALREADY_OPEN',
    message: 'An active session already exists for this device.',
  },
  SessionNotFound: {
    key: 'SESSION_NOT_FOUND',
    message: 'Register session not found.',
  },
  SessionAlreadyClosed: {
    key: 'SESSION_ALREADY_CLOSED',
    message: 'Session is already closed.',
  },
  NoActiveSession: {
    key: 'NO_ACTIVE_SESSION',
    message: 'No active session found for this device.',
  },
};
