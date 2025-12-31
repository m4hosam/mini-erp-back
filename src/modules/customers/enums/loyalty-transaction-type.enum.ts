/**
 * Types of loyalty point transactions.
 *
 * - EARN: Points earned from purchases or promotions
 * - REDEEM: Points redeemed for discounts or rewards
 * - EXPIRE: Points expired due to inactivity or time limit
 * - ADJUST: Manual adjustment by admin (correction, bonus, etc.)
 */
export enum LoyaltyTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  EXPIRE = 'EXPIRE',
  ADJUST = 'ADJUST',
}
