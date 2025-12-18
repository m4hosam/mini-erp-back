import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'PRD-001',
    description: 'Stock Keeping Unit (Internal Code)',
  })
  @IsString()
  @MinLength(1)
  sku: string;

  @ApiProperty({
    example: '1234567890123',
    description: 'UPC/EAN barcode for scanning',
    required: false,
  })
  @IsString()
  @IsOptional()
  barcode?: string;

  @ApiProperty({
    example: 'Fresh Orange Juice',
    description: 'Product name',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'Freshly squeezed orange juice',
    description: 'Product description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 15.5,
    description: 'Cost of Goods Sold (COGS)',
  })
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty({
    example: 25.99,
    description: 'Retail price',
  })
  @IsNumber()
  @Min(0.01)
  salePrice: number;

  @ApiProperty({
    example: 'kg',
    description: 'Unit of measurement (e.g., kg, pcs, box)',
  })
  @IsString()
  @MinLength(1)
  unit: string;

  @ApiProperty({
    example: 1,
    description: 'Category ID',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiProperty({
    example: 10,
    description: 'Threshold for low stock alert',
    required: false,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'Product image URL',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    example: 7,
    description: 'Shelf life in days',
    required: false,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  shelfLifeDays?: number;

  @ApiProperty({
    example: false,
    description: 'Whether product requires cold storage',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresColdStorage?: boolean;
}
