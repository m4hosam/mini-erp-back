import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class HoldOrderDto {
  @ApiProperty({ example: 'Customer stepped out', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
