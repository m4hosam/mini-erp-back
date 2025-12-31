import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'Customer requested cancellation' })
  @IsString()
  reason: string;
}
