import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive } from 'class-validator';

export class VoidOrderDto {
  @ApiProperty({ example: 'Duplicate order' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 1, description: 'Manager user ID who authorized void' })
  @IsInt()
  @IsPositive()
  authorizedBy: number;
}
