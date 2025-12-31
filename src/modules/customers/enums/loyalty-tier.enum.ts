/**
 * Loyalty tier levels based on lifetime points accumulated.
 *
 * Tiers:
 * - BRONZE: 0-499 lifetime points
 * - SILVER: 500-999 lifetime points
 * - GOLD: 1000-1499 lifetime points
 * - PLATINUM: 1500+ lifetime points
 */
export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

/**
 * Helper constants for tier thresholds
 */
export const LoyaltyTierThresholds = {
  BRONZE: { min: 0, max: 499 },
  SILVER: { min: 500, max: 999 },
  GOLD: { min: 1000, max: 1499 },
  PLATINUM: { min: 1500, max: Infinity },
};
