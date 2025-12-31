import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderItemModifier } from './order-item-modifier.entity';
import { KitchenStatus } from '../enums/kitchen-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'order_items' })
export class OrderItem extends BaseTransactionEntity {
  @ApiProperty({ type: () => Order })
  @Exclude()
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ name: 'order_id' })
  orderId: number;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ name: 'product_id' })
  productId: number;

  // Product name snapshots for reporting (in case product is deleted/renamed)
  @ApiProperty({ example: 'Margherita Pizza', description: 'Product name snapshot (English)' })
  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @ApiProperty({
    example: 'بيتزا مارغريتا',
    description: 'Product name snapshot (Arabic)',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  productNameAr: string;

  @ApiProperty({ example: 2 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({ example: 25.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 15.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @ApiProperty({ example: 51.0, description: 'Line total (quantity * unitPrice + modifiers)' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subTotal: number;

  @ApiProperty({ example: 51.0, description: 'Same as subTotal (alias)' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  lineTotal: number;

  @ApiProperty({ example: 'No onions please', required: false })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Kitchen workflow
  @ApiProperty({ enum: KitchenStatus, default: KitchenStatus.PENDING })
  @Column({
    type: 'enum',
    enum: KitchenStatus,
    default: KitchenStatus.PENDING,
  })
  kitchenStatus: KitchenStatus;

  @ApiProperty({ description: 'Timestamp when item was fired to kitchen', required: false })
  @Column({ type: 'timestamp', nullable: true })
  firedAt: Date;

  // Void tracking
  @ApiProperty({ example: false, description: 'Whether this item is voided' })
  @Column({ type: 'boolean', default: false })
  isVoided: boolean;

  @ApiProperty({ example: 'Customer changed mind', required: false })
  @Column({ type: 'text', nullable: true })
  voidReason: string;

  @ApiProperty({ description: 'Manager who authorized void', required: false })
  @Column({ name: 'void_authorized_by', nullable: true })
  voidAuthorizedBy: number;

  @ApiProperty({ description: 'Void timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  voidedAt: Date;

  // Relationships
  @ApiProperty({ type: () => [OrderItemModifier] })
  @OneToMany(() => OrderItemModifier, (modifier) => modifier.orderItem, {
    cascade: true,
  })
  modifiers: OrderItemModifier[];
}
