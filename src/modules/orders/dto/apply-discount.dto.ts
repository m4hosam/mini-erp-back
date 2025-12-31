import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsInt, IsPositive } from 'class-validator';

export class ApplyDiscountDto {
  @ApiProperty({ example: 'PERCENT', enum: ['PERCENT', 'FIXED'] })
  @IsString()
  @IsIn(['PERCENT', 'FIXED'])
  type: 'PERCENT' | 'FIXED';

  @ApiProperty({ example: '10', description: 'Discount value (percentage or fixed amount)' })
  @IsString()
  value: string;

  @ApiProperty({ example: 'Manager approval for loyalty customer', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 1, description: 'User ID who authorized discount', required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  authorizedBy?: number;
}
