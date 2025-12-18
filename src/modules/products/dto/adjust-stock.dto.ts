import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';

export enum StockAdjustmentType {
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  SET = 'SET',
}

export class AdjustStockDto {
  @ApiProperty({
    example: 50,
    description: 'Quantity to adjust',
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: 'ADD',
    enum: StockAdjustmentType,
    description: 'Type of adjustment',
  })
  @IsEnum(StockAdjustmentType)
  type: StockAdjustmentType;

  @ApiProperty({
    example: 'Restock from supplier',
    description: 'Reason for adjustment',
  })
  @IsString()
  reason: string;

  @ApiProperty({
    example: 'PO-12345',
    description: 'Reference ID (e.g., Purchase Order ID)',
    required: false,
  })
  @IsString()
  @IsOptional()
  referenceId?: string;
}
