import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsInt,
  IsPositive,
  IsArray,
  ValidateNested,
  IsString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType } from '../enums/order-type.enum';
import { CreateOrderItemDto } from './create-order-item.dto';
import { OrderDiscountDto } from './order-discount.dto';

export class CreateOrderDto {
  @ApiProperty({ enum: OrderType, example: OrderType.DINE_IN })
  @IsEnum(OrderType)
  orderType: OrderType;

  @ApiProperty({ example: 1, description: 'Customer ID', required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  customerId?: number;

  @ApiProperty({ example: 1, description: 'Table ID (for dine-in)', required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  tableId?: number;

  @ApiProperty({ type: [CreateOrderItemDto], description: 'Order items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ example: 'Customer allergic to peanuts', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: OrderDiscountDto, required: false })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OrderDiscountDto)
  discount?: OrderDiscountDto;
}
