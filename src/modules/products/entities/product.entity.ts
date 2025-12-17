import { Entity, Column } from 'typeorm';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';

@Entity({ name: 'products' })
export class Product extends BaseTransactionEntity {
  @Column({ unique: true })
  sku: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salePrice: number;

  @Column()
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStock: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  reorderLevel: number;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'int', nullable: true })
  shelfLifeDays: number;

  @Column({ default: false })
  requiresColdStorage: boolean;
}
