import {
  Entity,
  Column,
  Check,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

@Entity({ name: 'orders' })
export class Order extends BaseTransactionEntity {
  @Column({ unique: true })
  orderNumber: string;

  @Column()
  customerName: string;

  @Column()
  customerPhone: string;

  @Column({ type: 'text' })
  customerAddress: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSalePrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalProductCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  miscCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  netProfit: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  deliveryDistanceKm: number;

  @Column({ type: 'timestamp', nullable: true })
  deliveryDate: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: User;

  @Column({ type: 'int', nullable: true })
  driverId: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ default: 'MANUAL' })
  orderSource: string;
}
