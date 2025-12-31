import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderPayment } from './order-payment.entity';
import { OrderRefund } from './order-refund.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderType } from '../enums/order-type.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity({ name: 'orders' })
export class Order extends BaseTransactionEntity {
  @ApiProperty({ example: 'ORD-20231221-001' })
  @Column({ unique: true })
  orderNumber: string;

  @ApiProperty({ enum: OrderType, example: OrderType.DINE_IN })
  @Column({
    type: 'enum',
    enum: OrderType,
  })
  orderType: OrderType;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.DRAFT,
  })
  status: OrderStatus;

  @ApiProperty({ enum: PaymentStatus, default: PaymentStatus.UNPAID })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({ example: 1, description: 'Table ID for dine-in orders', required: false })
  @Column({ name: 'table_id', nullable: true })
  tableId: number;

  @ApiProperty({ example: 'Table 5', description: 'Table name/number', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  tableName: string;

  // Financial fields
  @ApiProperty({ example: 100.0, description: 'Subtotal before tax and discount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @ApiProperty({ example: 10.0, description: 'Total discount amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountTotal: number;

  @ApiProperty({ example: 15.0, description: 'Total tax amount (VAT)' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxTotal: number;

  @ApiProperty({ example: 105.0, description: 'Final total amount' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @ApiProperty({ example: 105.0, description: 'Amount already paid' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @ApiProperty({ example: 0, description: 'Amount still due' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountDue: number;

  // Keep legacy fields for backward compatibility
  @ApiProperty({ example: 150.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSalePrice: number;

  @ApiProperty({ example: 100.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProductCost: number;

  @ApiProperty({ example: 50.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netProfit: number;

  // Discount object (stored as JSON)
  @ApiProperty({
    example: { type: 'PERCENT', value: '10', reason: 'Happy hour', authorizedBy: 1 },
    description: 'Discount details',
    required: false,
  })
  @Column({ type: 'jsonb', nullable: true })
  discount: {
    type: 'PERCENT' | 'FIXED';
    value: string;
    reason?: string;
    authorizedBy?: number;
  };

  @ApiProperty({ example: 'Customer requested no onions', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({
    example: 1,
    description: 'Register session ID (for cash reconciliation)',
    required: false,
  })
  @Column({ name: 'register_session_id', nullable: true })
  registerSessionId: number;

  // Timestamps
  @ApiProperty({ description: 'Order completion timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @ApiProperty({ description: 'Order cancellation timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @ApiProperty({ description: 'Cancellation reason', required: false })
  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  @ApiProperty({ description: 'Order void timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  voidedAt: Date;

  @ApiProperty({ description: 'Void reason', required: false })
  @Column({ type: 'text', nullable: true })
  voidReason: string;

  @ApiProperty({
    description: 'User ID who authorized void (manager)',
    required: false,
  })
  @Column({ name: 'void_authorized_by', nullable: true })
  voidAuthorizedBy: number;

  @ApiProperty({ description: 'Order hold timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  heldAt: Date;

  @ApiProperty({ description: 'Hold note/reason', required: false })
  @Column({ type: 'text', nullable: true })
  holdNote: string | null;

  @ApiProperty({ description: 'Order recall timestamp (from held)', required: false })
  @Column({ type: 'timestamp', nullable: true })
  recalledAt: Date;

  // ZATCA (Saudi e-invoicing) fields
  @ApiProperty({
    example: 'a1b2c3d4e5f6...',
    description: 'SHA256 invoice hash for ZATCA',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  invoiceHash: string;

  @ApiProperty({
    example: 'x9y8z7...',
    description: 'Previous invoice hash for chain integrity',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  previousHash: string;

  @ApiProperty({
    example: 'base64EncodedQRCode...',
    description: 'ZATCA TLV-encoded QR code',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  zatcaQrCode: string;

  // Relationships
  @ApiProperty({ type: () => Customer })
  @ManyToOne(() => Customer, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'customer_id' })
  customerId: number;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ name: 'driver_id', nullable: true })
  driverId: number;

  @ApiProperty({ type: () => [OrderItem] })
  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @ApiProperty({ type: () => [OrderPayment] })
  @OneToMany(() => OrderPayment, (payment) => payment.order, { cascade: true })
  payments: OrderPayment[];

  @ApiProperty({ type: () => [OrderRefund] })
  @OneToMany(() => OrderRefund, (refund) => refund.order, { cascade: true })
  refunds: OrderRefund[];
}
