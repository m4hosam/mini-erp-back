import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'order_items' })
export class OrderItem extends BaseTransactionEntity {
  @ApiProperty({ type: () => Order })
  @Exclude()
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ApiProperty({ type: () => Product })
  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: 2 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @ApiProperty({ example: 25.5 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 15.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitCost: number;

  @ApiProperty({ example: 51.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subTotal: number;
}
