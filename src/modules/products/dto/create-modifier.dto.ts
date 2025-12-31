import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateModifierDto {
  @ApiProperty({ example: 1, description: 'Modifier group ID' })
  @IsInt()
  @Min(1)
  groupId: number;

  @ApiProperty({ example: 'Large', description: 'Modifier name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'كبير',
    description: 'Modifier name in Arabic',
  })
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiProperty({
    example: 5.0,
    description: 'Price adjustment (can be positive or negative)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  price: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is the default selection',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order within group',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
