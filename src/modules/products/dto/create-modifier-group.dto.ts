import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SelectionType } from '../enums/selection-type.enum';

export class CreateModifierGroupDto {
  @ApiProperty({ example: 'Size', description: 'Modifier group name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'الحجم',
    description: 'Modifier group name in Arabic',
  })
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional({
    example: 'Choose your size',
    description: 'Group description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: SelectionType,
    example: SelectionType.SINGLE,
    description: 'Selection type (SINGLE or MULTIPLE)',
  })
  @IsEnum(SelectionType)
  selectionType: SelectionType;

  @ApiProperty({
    example: true,
    description: 'Whether selection from this group is required',
  })
  @IsBoolean()
  isRequired: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Minimum number of selections (for MULTIPLE type)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Maximum number of selections (for MULTIPLE type)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order',
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
