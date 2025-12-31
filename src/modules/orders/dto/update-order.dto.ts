import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, IsPositive, IsString } from 'class-validator';
import { OrderType } from '../enums/order-type.enum';

export class UpdateOrderDto {
  @ApiProperty({ enum: OrderType, required: false })
  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @ApiProperty({ example: 1, description: 'Table ID', required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  tableId?: number;

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
