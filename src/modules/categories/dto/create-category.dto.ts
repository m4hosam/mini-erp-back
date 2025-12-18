import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Beverages',
    description: 'Category name',
  })
  @IsString()
  @MinLength(2)
  name: string;

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
