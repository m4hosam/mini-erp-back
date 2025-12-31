import { Entity, Column, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Modifier } from './modifier.entity';
import { SelectionType } from '../enums/selection-type.enum';

/**
 * Modifier Group entity.
 * Groups related modifiers together (e.g., "Size", "Toppings", "Extras").
 * Defines selection rules (single vs multiple) and validation constraints.
 */
@Entity({ name: 'modifier_groups' })
export class ModifierGroup extends BaseTransactionEntity {
  @ApiProperty({ example: 'Size', description: 'Modifier group name' })
  @Column()
  name: string;

  @ApiProperty({
    example: 'الحجم',
    description: 'Modifier group name in Arabic',
    required: false,
  })
  @Column({ name: 'name_ar', nullable: true })
  nameAr: string | null;

  @ApiProperty({
    example: 'Choose your size',
    description: 'Group description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({
    description: 'Selection type',
    enum: SelectionType,
    example: SelectionType.SINGLE,
  })
  @Column({
    name: 'selection_type',
    type: 'enum',
    enum: SelectionType,
    default: SelectionType.SINGLE,
  })
  selectionType: SelectionType;

  @ApiProperty({
    example: true,
    description: 'Whether customer must select from this group',
  })
  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @ApiProperty({
    example: 1,
    description: 'Minimum number of selections required',
    required: false,
  })
  @Column({ name: 'min_selections', type: 'int', nullable: true })
  minSelections: number | null;

  @ApiProperty({
    example: 3,
    description: 'Maximum number of selections allowed',
    required: false,
  })
  @Column({ name: 'max_selections', type: 'int', nullable: true })
  maxSelections: number | null;

  @ApiProperty({
    example: 1,
    description: 'Display order for UI',
  })
  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  // Relationships
  @OneToMany(() => Modifier, (modifier) => modifier.group)
  modifiers: Modifier[];
}
