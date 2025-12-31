import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for redeeming loyalty points.
 * Points are redeemed at rate: 10 points = 1 SAR
 * Points must be in multiples of 10.
 */
export class RedeemLoyaltyPointsDto {
  @ApiProperty({
    example: 100,
    description: 'Number of points to redeem (must be multiple of 10)',
  })
  @IsInt()
  @Min(10)
  points: number;
}
