import { IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for manually adding store credit to a customer.
 * Used by admins/managers for gifts, promotions, or compensation.
 */
export class AddStoreCreditDto {
  @ApiProperty({
    example: 50.0,
    description: 'Amount of credit to add (must be positive)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: 'Promotional credit',
    description: 'Reason for adding credit',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
