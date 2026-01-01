import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { LoyaltyTier } from '../enums/loyalty-tier.enum';
import { LoyaltyTransaction } from './loyalty-transaction.entity';
import { StoreCreditTransaction } from './store-credit-transaction.entity';

@Entity({ name: 'customers' })
export class Customer extends BaseTransactionEntity {
  @ApiProperty({ example: 'John Doe', description: 'Customer Name' })
  @Column()
  name: string;

  @ApiProperty({
    example: 'جون دو',
    description: 'Customer Name in Arabic',
    required: false,
  })
  @Column({ name: 'name_ar', type: 'varchar', nullable: true })
  nameAr: string | null;

  @ApiProperty({ example: '0501234567', description: 'Phone Number (unique)' })
  @Column({ unique: true })
  phone: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email Address',
    required: false,
  })
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @ApiProperty({
    example: 'Riyadh, Saudi Arabia',
    description: 'Delivery Address',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  address: string | null;

  @ApiProperty({ example: 5, description: 'Total successful orders count' })
  @Column({ name: 'total_orders_count', type: 'int', default: 0 })
  totalOrdersCount: number;

  // Loyalty Program Fields
  @ApiProperty({
    description: 'Customer loyalty tier',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE,
  })
  @Column({
    name: 'loyalty_tier',
    type: 'enum',
    enum: LoyaltyTier,
    default: LoyaltyTier.BRONZE,
  })
  loyaltyTier: LoyaltyTier;

  @ApiProperty({ description: 'Current available loyalty points', default: 0 })
  @Column({ name: 'loyalty_points', type: 'int', default: 0 })
  loyaltyPoints: number;

  @ApiProperty({
    description: 'Lifetime accumulated points (never decreases)',
    default: 0,
  })
  @Column({ name: 'lifetime_points', type: 'int', default: 0 })
  lifetimePoints: number;

  // Store Credit
  @ApiProperty({
    description: 'Available store credit balance',
    example: 50.0,
    default: 0,
  })
  @Column({
    name: 'store_credit',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  storeCredit: number;

  // Customer Statistics
  @ApiProperty({
    description: 'Total amount spent by customer',
    example: 1250.5,
    default: 0,
  })
  @Column({
    name: 'total_spent',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalSpent: number;

  @ApiProperty({
    description: 'Last visit timestamp',
    required: false,
  })
  @Column({ name: 'last_visit_at', type: 'timestamp', nullable: true })
  lastVisitAt: Date | null;

  // Additional Info
  @ApiProperty({
    description: 'Internal notes about customer',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({
    description: 'Customer tags (JSON array)',
    example: ['VIP', 'Regular'],
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  tags: string[] | null;

  // Relationships
  @OneToMany(() => LoyaltyTransaction, (transaction) => transaction.customer)
  loyaltyTransactions: LoyaltyTransaction[];

  @OneToMany(() => StoreCreditTransaction, (transaction) => transaction.customer)
  storeCreditTransactions: StoreCreditTransaction[];

  // isActive is already in BaseTransactionEntity
}
