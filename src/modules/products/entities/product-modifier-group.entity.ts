import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { ModifierGroup } from './modifier-group.entity';

/**
 * Join table linking Products to their Modifier Groups.
 * Allows products to have multiple modifier groups (e.g., Size, Toppings, Extras).
 */
@Entity({ name: 'product_modifier_groups' })
export class ProductModifierGroup {
  @PrimaryColumn({ name: 'product_id' })
  productId: number;

  @PrimaryColumn({ name: 'modifier_group_id' })
  modifierGroupId: number;

  @ApiProperty({
    example: 1,
    description: 'Display order for this modifier group on the product',
  })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  // Relationships
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ModifierGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'modifier_group_id' })
  modifierGroup: ModifierGroup;
}
