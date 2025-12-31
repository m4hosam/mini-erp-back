import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'مشروبات' })
  nameAr: string;

  @ApiProperty({ example: 'Beverages' })
  nameEn: string;

  @ApiProperty({ example: 'beverages' })
  slug: string;

  @ApiProperty({ example: 'All beverage products', required: false })
  description?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 1, required: false })
  parentId?: number;

  @ApiProperty({ type: [CategoryResponseDto], required: false })
  children?: CategoryResponseDto[];

  @ApiProperty({ example: '2025-12-18T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-12-18T10:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: 1, required: false })
  createdBy?: number;

  @ApiProperty({ example: 1, required: false })
  updatedBy?: number;
}
