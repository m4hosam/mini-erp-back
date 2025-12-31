export enum OrderStatus {
  RECEIVED = 'RECEIVED',
  SOURCING = 'SOURCING',
  PREPARING = 'PREPARING',
  PACKAGING = 'PACKAGING', // Wait, prompt said PACKAGING is after PREPARING
  READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', // Assuming some final state?
  // Prompt said:
  // Allowed: RECEIVED → SOURCING | PREPARING | CANCELLED.
  // Allowed: PREPARING → PACKAGING | CANCELLED.
  // It didn't specify end states explicitly in "State Machine" list but typically Delivered/Completed exists.
  // I will stick to what was explicitly mentioned + standard completed/cancelled.
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}
