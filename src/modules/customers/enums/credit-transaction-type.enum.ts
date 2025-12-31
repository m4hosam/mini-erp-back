/**
 * Types of store credit transactions.
 *
 * - ADD: Credit added to customer account (gift, promotion, etc.)
 * - USE: Credit used for payment
 * - EXPIRE: Credit expired due to time limit
 * - REFUND: Credit added from order refund
 */
export enum CreditTransactionType {
  ADD = 'ADD',
  USE = 'USE',
  EXPIRE = 'EXPIRE',
  REFUND = 'REFUND',
}
