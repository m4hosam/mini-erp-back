import {
  Entity,
  Column,
  OneToMany,
  Tree,
  TreeParent,
  TreeChildren,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { Product } from '../../products/entities/product.entity';

@Entity({ name: 'categories' })
@Tree('closure-table')
export class Category extends BaseTransactionEntity {
  @ApiProperty({ example: 'Beverages', description: 'Category name' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({ example: 'beverages', description: 'URL-friendly slug' })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({
    example: 'All beverage products',
    description: 'Category description',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Parent category',
    type: () => Category,
    required: false,
  })
  @TreeParent()
  parent: Category;

  @ApiProperty({
    description: 'Child categories',
    type: () => [Category],
    required: false,
  })
  @TreeChildren()
  children: Category[];

  @ApiProperty({
    description: 'Products in this category',
    type: () => [Product],
    required: false,
  })
  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
