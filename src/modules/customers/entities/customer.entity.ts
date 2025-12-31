import { Entity, Column } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';

@Entity({ name: 'customers' })
export class Customer extends BaseTransactionEntity {
  @ApiProperty({ example: 'John Doe', description: 'Customer Name' })
  @Column()
  name: string;

  @ApiProperty({ example: '0501234567', description: 'Phone Number' })
  @Column({ unique: true })
  phone: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email Address',
    required: false,
  })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({
    example: 'Riyadh, Saudi Arabia',
    description: 'Delivery Address',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({ example: 5, description: 'Total successful orders count' })
  @Column({ type: 'int', default: 0 })
  totalOrdersCount: number;

  // isActive is already in BaseTransactionEntity
}
