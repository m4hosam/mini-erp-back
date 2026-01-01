import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OpenSessionDto {
  @ApiProperty({
    example: 'POS-01',
    description: 'Device/Register identifier',
  })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({
    example: 1000.0,
    description: 'Starting cash amount in drawer',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  openingBalance: number;
}
