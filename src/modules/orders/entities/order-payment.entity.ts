import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Order } from './order.entity';
import { PaymentMethod } from '../enums/payment-method.enum';

@Entity({ name: 'order_payments' })
export class OrderPayment extends BaseTransactionEntity {
  @ApiProperty({ type: () => Order })
  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @ApiProperty({ example: 100.0, description: 'Payment amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    example: '****1234',
    description: 'Payment reference (card last 4 digits, transaction ID, etc.)',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  reference: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00Z', description: 'Payment processing timestamp' })
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  processedAt: Date;
}
