import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'PRD-001' })
  sku: string;

  @ApiProperty({ example: '1234567890123', required: false })
  barcode?: string;

  @ApiProperty({ example: 'Fresh Orange Juice' })
  name: string;

  @ApiProperty({ example: 'Freshly squeezed orange juice', required: false })
  description?: string;

  @ApiProperty({ example: 15.5 })
  costPrice: number;

  @ApiProperty({ example: 25.99 })
  salePrice: number;

  @ApiProperty({ example: 'kg' })
  unit: string;

  @ApiProperty({ example: 100.5 })
  currentStock: number;

  @ApiProperty({ example: 10 })
  reorderLevel: number;

  @ApiProperty({ example: 1, required: false })
  categoryId?: number;

  @ApiProperty({ example: 'Beverages', required: false })
  categoryName?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  imageUrl?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 7, required: false })
  shelfLifeDays?: number;

  @ApiProperty({ example: false })
  requiresColdStorage: boolean;

  @ApiProperty({
    example: 'IN_STOCK',
    enum: ['OUT_OF_STOCK', 'LOW_STOCK', 'IN_STOCK'],
    description: 'Computed stock status',
  })
  stockStatus: string;

  @ApiProperty({
    example: 40.38,
    description: 'Profit margin percentage',
  })
  margin: number;

  @ApiProperty({ example: '2025-12-18T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-18T10:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: 1, required: false })
  createdBy?: number;

  @ApiProperty({ example: 1, required: false })
  updatedBy?: number;
}
