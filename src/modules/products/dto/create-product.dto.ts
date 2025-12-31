import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsInt,
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
    example: 'عصير برتقال طازج',
    description: 'Arabic Name',
  })
  @IsString()
  @MinLength(2)
  nameAr: string;

  @ApiProperty({
    example: 'Fresh Orange Juice',
    description: 'English Name',
  })
  @IsString()
  @MinLength(2)
  nameEn: string;

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

  @ApiProperty({
    example: true,
    description: 'Whether the product is active',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // POS & Tax Fields
  @ApiPropertyOptional({
    example: true,
    description: 'Whether product is taxable',
  })
  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @ApiPropertyOptional({
    example: 15.0,
    description: 'Tax rate percentage (default: 15% for Saudi VAT)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether product needs kitchen preparation',
  })
  @IsOptional()
  @IsBoolean()
  isPrepared?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to track inventory for this product',
  })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({
    example: 100.0,
    description: 'Stock quantity (only used if trackInventory is true)',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Low stock alert threshold',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  // Modifier Groups
  @ApiPropertyOptional({
    example: [1, 2, 3],
    description: 'Array of modifier group IDs to attach to this product',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  modifierGroupIds?: number[];
}
