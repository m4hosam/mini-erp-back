import { IsString, IsNotEmpty, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum StockAdjustmentType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
}

export class AdjustStockDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ enum: StockAdjustmentType })
  @IsEnum(StockAdjustmentType)
  type: StockAdjustmentType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
