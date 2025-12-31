import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive } from 'class-validator';

export class VoidItemDto {
  @ApiProperty({ example: 'Customer changed mind' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 1, description: 'Manager user ID who authorized void' })
  @IsInt()
  @IsPositive()
  authorizedBy: number;
}
