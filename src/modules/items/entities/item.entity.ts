import { Entity, Column, Index } from 'typeorm';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';

@Entity({ name: 'items', schema: 'public' })
@Index(['name'])
@Index(['sku'])
export class Item extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
  })
  price: number;

  @Column({ type: 'varchar', length: 50, nullable: false, unique: true })
  sku: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  stockQuantity: number;
}
