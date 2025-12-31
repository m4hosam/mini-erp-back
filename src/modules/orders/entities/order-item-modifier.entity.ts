import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'order_item_modifiers' })
export class OrderItemModifier extends BaseTransactionEntity {
  @ApiProperty({ type: () => OrderItem })
  @ManyToOne(() => OrderItem, (orderItem) => orderItem.modifiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ name: 'order_item_id' })
  orderItemId: number;

  @ApiProperty({ example: 1, description: 'Reference to modifier (from products module)' })
  @Column({ name: 'modifier_id' })
  modifierId: number;

  @ApiProperty({ example: 'Extra Cheese', description: 'Modifier name snapshot (English)' })
  @Column({ type: 'varchar', length: 255 })
  modifierName: string;

  @ApiProperty({
    example: 'جبنة إضافية',
    description: 'Modifier name snapshot (Arabic)',
    required: false,
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  modifierNameAr: string;

  @ApiProperty({ example: 5.0, description: 'Modifier price adjustment (snapshot)' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty({ example: 1, description: 'Quantity of this modifier' })
  @Column({ type: 'int', default: 1 })
  quantity: number;
}
