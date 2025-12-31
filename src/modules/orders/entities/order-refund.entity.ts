import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'order_refunds' })
export class OrderRefund extends BaseTransactionEntity {
  @ApiProperty({ type: () => Order })
  @ManyToOne(() => Order, (order) => order.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  @ApiProperty({ example: 50.0, description: 'Refund amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: 'Customer not satisfied with quality', description: 'Refund reason' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ type: () => User, description: 'Manager who authorized the refund' })
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'authorized_by' })
  authorizer: User;

  @Column({ name: 'authorized_by' })
  authorizedBy: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Refund processing timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  processedAt: Date;
}
