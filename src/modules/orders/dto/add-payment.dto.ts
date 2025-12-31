import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsPositive, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum';

export class AddPaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.CASH })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ example: 100.0, description: 'Payment amount' })
  @IsPositive()
  amount: number;

  @ApiProperty({
    example: '****1234',
    description: 'Payment reference (card last 4, transaction ID, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  reference?: string;
}
