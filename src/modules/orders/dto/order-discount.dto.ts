import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsPositive, IsInt } from 'class-validator';

export class OrderDiscountDto {
  @ApiProperty({ example: 'PERCENT', enum: ['PERCENT', 'FIXED'] })
  @IsString()
  @IsIn(['PERCENT', 'FIXED'])
  type: 'PERCENT' | 'FIXED';

  @ApiProperty({ example: '10', description: 'Discount value (percentage or fixed amount)' })
  @IsString()
  value: string;

  @ApiProperty({ example: 'Happy hour discount', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ example: 1, description: 'User ID who authorized discount', required: false })
  @IsOptional()
  @IsInt()
  @IsPositive()
  authorizedBy?: number;
}
