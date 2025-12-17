import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  costPrice: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStock?: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderLevel?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  shelfLifeDays?: number;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  requiresColdStorage?: boolean;
}
