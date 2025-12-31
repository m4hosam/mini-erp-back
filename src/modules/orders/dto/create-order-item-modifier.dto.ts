import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateOrderItemModifierDto {
  @ApiProperty({ example: 1, description: 'Modifier ID' })
  @IsInt()
  @IsPositive()
  modifierId: number;

  @ApiProperty({ example: 1, description: 'Quantity of this modifier', default: 1 })
  @IsInt()
  @IsPositive()
  quantity: number = 1;
}
