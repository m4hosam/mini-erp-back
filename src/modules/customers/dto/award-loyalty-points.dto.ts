import { IsInt, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for manually awarding loyalty points to a customer.
 * Used by admins/managers for bonuses, promotions, or adjustments.
 */
export class AwardLoyaltyPointsDto {
  @ApiProperty({
    example: 100,
    description: 'Number of points to award (must be positive)',
  })
  @IsInt()
  @Min(1)
  points: number;

  @ApiProperty({
    example: 'Promotional bonus',
    description: 'Reason for awarding points',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
