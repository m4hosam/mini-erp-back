import { PartialType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';
import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @ApiProperty({ description: 'Item ID to update' })
  @IsInt({ message: 'ITEM_ID_MUST_BE_NUMBER' })
  @IsNotEmpty({ message: 'ITEM_ID_REQUIRED' })
  id: number;
}
