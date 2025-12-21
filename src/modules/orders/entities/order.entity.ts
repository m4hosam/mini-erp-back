import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';

@Entity({ name: 'orders' })
export class Order extends BaseTransactionEntity {
  @ApiProperty({ example: 'ORD-20231221-001' })
  @Column({ unique: true })
  orderNumber: string;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.RECEIVED })
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @ApiProperty({ example: 150.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSalePrice: number;

  @ApiProperty({ example: 100.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProductCost: number;

  @ApiProperty({ example: 50.0 })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netProfit: number;

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
}
