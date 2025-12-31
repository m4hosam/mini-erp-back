import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional } from 'class-validator';

export class FireItemsDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Order item IDs to fire (empty or omit to fire all)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  itemIds?: number[];
}
