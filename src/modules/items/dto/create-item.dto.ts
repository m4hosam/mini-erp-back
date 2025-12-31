import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'NAME_REQUIRED' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0, { message: 'PRICE_MUST_BE_POSITIVE' })
  price: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'SKU_REQUIRED' })
  @MaxLength(50)
  sku: string;

  @ApiProperty()
  @IsNumber()
  @Min(0, { message: 'STOCK_MUST_BE_POSITIVE' })
  stockQuantity: number;
}
