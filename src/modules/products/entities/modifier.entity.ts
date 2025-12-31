import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { ModifierGroup } from './modifier-group.entity';

/**
 * Modifier entity.
 * Individual modifier options within a group (e.g., "Small", "Medium", "Large" in the "Size" group).
 */
@Entity({ name: 'modifiers' })
export class Modifier extends BaseTransactionEntity {
  @ApiProperty({ description: 'Modifier group ID' })
  @Column({ name: 'group_id' })
  groupId: number;

  @ApiProperty({ example: 'Large', description: 'Modifier name' })
  @Column()
  name: string;

  @ApiProperty({
    example: 'كبير',
    description: 'Modifier name in Arabic',
    required: false,
  })
  @Column({ name: 'name_ar', nullable: true })
  nameAr: string | null;

  @ApiProperty({
    example: 5.0,
    description: 'Price adjustment (can be positive or negative)',
  })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @ApiProperty({
    example: false,
    description: 'Whether this is the default selection',
  })
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ApiProperty({
    example: 1,
    description: 'Display order within group',
  })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  // Relationships
  @ManyToOne(() => ModifierGroup, (group) => group.modifiers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: ModifierGroup;
}
