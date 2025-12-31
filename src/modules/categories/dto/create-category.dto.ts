import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'مشروبات',
    description: 'Arabic Name',
  })
  @IsString()
  @MinLength(2)
  nameAr: string;

  @ApiProperty({
    example: 'Beverages',
    description: 'English Name',
  })
  @IsString()
  @MinLength(2)
  nameEn: string;

  @ApiProperty({
    example: 'All beverage products',
    description: 'Category description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 1,
    description: 'Parent category ID for hierarchical structure',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  parentId?: number;
}
