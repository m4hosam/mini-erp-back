import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsPositive,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemModifierDto } from './create-order-item-modifier.dto';

export class CreateOrderItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  @IsPositive()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsPositive()
  quantity: number;

  @ApiProperty({
    type: [CreateOrderItemModifierDto],
    description: 'Selected modifiers',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemModifierDto)
  modifiers?: CreateOrderItemModifierDto[];

  @ApiProperty({ example: 'No onions', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
