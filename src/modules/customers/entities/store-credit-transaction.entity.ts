import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Customer } from './customer.entity';
import { Order } from '../../orders/entities/order.entity';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';

/**
 * Entity for tracking store credit transactions.
 * Records all credit activity: additions, usage, expirations, and refunds.
 */
@Entity({ name: 'store_credit_transactions' })
export class StoreCreditTransaction extends BaseTransactionEntity {
  @ApiProperty({ description: 'Customer ID' })
  @Column({ name: 'customer_id' })
  customerId: number;

  @ApiProperty({ description: 'Transaction type', enum: CreditTransactionType })
  @Column({
    type: 'enum',
    enum: CreditTransactionType,
  })
  type: CreditTransactionType;

  @ApiProperty({ description: 'Credit amount (positive for add/refund, negative for use/expire)' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Reason for the transaction' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'Related order ID (if applicable)', required: false })
  @Column({ name: 'order_id', nullable: true })
  orderId: number | null;

  @ApiProperty({ description: 'Credit balance before transaction' })
  @Column({ name: 'balance_before', type: 'decimal', precision: 10, scale: 2 })
  balanceBefore: number;

  @ApiProperty({ description: 'Credit balance after transaction' })
  @Column({ name: 'balance_after', type: 'decimal', precision: 10, scale: 2 })
  balanceAfter: number;

  // Relationships
  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;
}
