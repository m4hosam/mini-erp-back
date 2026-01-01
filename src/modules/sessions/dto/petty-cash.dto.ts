import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PettyCashDto {
  @ApiProperty({
    example: 25.0,
    description: 'Amount paid out',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: 'Office supplies purchase',
    description: 'Reason for petty cash expense',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
