import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ProductResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  sku: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  costPrice: number;

  @ApiProperty()
  @Expose()
  salePrice: number;

  @ApiProperty()
  @Expose()
  unit: string;

  @ApiProperty()
  @Expose()
  currentStock: number;

  @ApiProperty()
  @Expose()
  reorderLevel: number;

  @ApiProperty()
  @Expose()
  category: string;

  @ApiProperty()
  @Expose()
  imageUrl: string;

  @ApiProperty()
  @Expose()
  shelfLifeDays: number;

  @ApiProperty()
  @Expose()
  requiresColdStorage: boolean;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  stockStatus: string;
}
