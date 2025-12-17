import { IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDriverDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  driverId: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  deliveryDistanceKm: number;
}
