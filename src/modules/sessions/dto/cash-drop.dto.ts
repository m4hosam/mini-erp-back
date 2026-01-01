import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CashDropDto {
  @ApiProperty({
    example: 500.0,
    description: 'Amount to drop to safe',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    example: 'Excess cash drop for security',
    description: 'Notes about the drop',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
