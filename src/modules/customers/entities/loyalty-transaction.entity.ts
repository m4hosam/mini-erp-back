import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Customer } from './customer.entity';
import { Order } from '../../orders/entities/order.entity';
import { LoyaltyTransactionType } from '../enums/loyalty-transaction-type.enum';

/**
 * Entity for tracking loyalty point transactions.
 * Records all point activity: earning, redemption, expiration, and adjustments.
 */
@Entity({ name: 'loyalty_transactions' })
export class LoyaltyTransaction extends BaseTransactionEntity {
  @ApiProperty({ description: 'Customer ID' })
  @Column({ name: 'customer_id' })
  customerId: number;

  @ApiProperty({ description: 'Transaction type', enum: LoyaltyTransactionType })
  @Column({
    type: 'enum',
    enum: LoyaltyTransactionType,
  })
  type: LoyaltyTransactionType;

  @ApiProperty({ description: 'Points amount (positive for earn/adjust, negative for redeem/expire)' })
  @Column({ type: 'int' })
  points: number;

  @ApiProperty({ description: 'Reason for the transaction' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'Related order ID (if applicable)', required: false })
  @Column({ name: 'order_id', nullable: true })
  orderId: number | null;

  @ApiProperty({ description: 'Balance after transaction' })
  @Column({ name: 'balance_after', type: 'int', default: 0 })
  balanceAfter: number;

  // Relationships
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;
}
