import { IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for using store credit for a payment.
 * This is typically called internally during order payment processing.
 */
export class UseStoreCreditDto {
  @ApiProperty({
    example: 25.5,
    description: 'Amount of credit to use (must be positive)',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: 123,
    description: 'Order ID for which credit is being used',
  })
  @IsInt()
  @Min(1)
  orderId: number;
}
