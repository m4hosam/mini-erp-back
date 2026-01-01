import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CloseSessionDto {
  @ApiProperty({
    example: 2500.0,
    description: 'Actual cash counted in drawer',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  closingBalance: number;

  @ApiPropertyOptional({
    example: 'End of shift',
    description: 'Notes about session closure',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
