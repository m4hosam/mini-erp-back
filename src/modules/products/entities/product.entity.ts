import { Entity, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Category } from '../../categories/entities/category.entity';
import { ModifierGroup } from './modifier-group.entity';

@Entity({ name: 'products' })
export class Product extends BaseTransactionEntity {
  @ApiProperty({
    example: 'PRD-001',
    description: 'Stock Keeping Unit (Internal Code)',
  })
  @Column({ unique: true })
  sku: string;

  @ApiProperty({
    example: '1234567890123',
    description: 'UPC/EAN barcode for scanning',
    required: false,
  })
  @Column({ nullable: true, unique: true })
  barcode: string;

  @ApiProperty({ example: 'عصير برتقال طازج', description: 'Arabic Name' })
  @Column({ nullable: true })
  nameAr: string;

  @ApiProperty({ example: 'Fresh Orange Juice', description: 'English Name' })
  @Column({ nullable: true })
  nameEn: string;

  @ApiProperty({
    example: 'Freshly squeezed orange juice',
    description: 'Product description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ example: 15.5, description: 'Cost of Goods Sold (COGS)' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  costPrice: number;

  @ApiProperty({ example: 25.99, description: 'Retail price' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  salePrice: number;

  @ApiProperty({
    example: 'kg',
    description: 'Unit of measurement (e.g., kg, pcs, box)',
  })
  @Column()
  unit: string;

  @ApiProperty({ example: 100.5, description: 'Current stock quantity' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  currentStock: number;

  @ApiProperty({ example: 10, description: 'Threshold for low stock alert' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 10 })
  reorderLevel: number;

  @ApiProperty({
    description: 'Product category',
    type: () => Category,
    required: false,
  })
  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'Product image URL',
    required: false,
  })
  @Column({ nullable: true })
  imageUrl: string;

  @ApiProperty({
    example: 7,
    description: 'Shelf life in days',
    required: false,
  })
  @Column({ type: 'int', nullable: true })
  shelfLifeDays: number;

  @ApiProperty({
    example: false,
    description: 'Whether product requires cold storage',
  })
  @Column({ default: false })
  requiresColdStorage: boolean;

  // Tax & Pricing
  @ApiProperty({
    example: true,
    description: 'Whether product is taxable',
  })
  @Column({ default: true })
  taxable: boolean;

  @ApiProperty({
    example: 15.0,
    description: 'Tax rate percentage (e.g., 15% VAT in Saudi Arabia)',
  })
  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 15.0 })
  taxRate: number;

  // Kitchen & Inventory
  @ApiProperty({
    example: true,
    description: 'Whether product needs kitchen preparation',
  })
  @Column({ name: 'is_prepared', default: true })
  isPrepared: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether to track inventory for this product',
  })
  @Column({ name: 'track_inventory', default: false })
  trackInventory: boolean;

  @ApiProperty({
    example: 100.0,
    description: 'Stock quantity (only used if trackInventory is true)',
    required: false,
  })
  @Column({ name: 'stock_quantity', type: 'decimal', precision: 10, scale: 2, nullable: true })
  stockQuantity: number | null;

  @ApiProperty({
    example: 10,
    description: 'Low stock alert threshold',
    required: false,
  })
  @Column({ name: 'low_stock_threshold', type: 'int', nullable: true })
  lowStockThreshold: number | null;

  // Relationships
  @ManyToMany(() => ModifierGroup)
  @JoinTable({
    name: 'product_modifier_groups',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'modifier_group_id', referencedColumnName: 'id' },
  })
  modifierGroups: ModifierGroup[];
}
