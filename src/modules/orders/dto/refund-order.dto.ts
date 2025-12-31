import { ApiProperty } from '@nestjs/swagger';
import { IsPositive, IsString, IsInt } from 'class-validator';

export class RefundOrderDto {
  @ApiProperty({ example: 50.0, description: 'Refund amount (full or partial)' })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'Product quality issue' })
  @IsString()
  reason: string;

  @ApiProperty({ example: 1, description: 'Manager user ID who authorized refund' })
  @IsInt()
  @IsPositive()
  authorizedBy: number;
}
