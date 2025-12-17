import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  customerAddress: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  miscCost?: number;

  @ApiProperty({ default: 'MANUAL' })
  @IsOptional()
  @IsString()
  orderSource?: string;
}
