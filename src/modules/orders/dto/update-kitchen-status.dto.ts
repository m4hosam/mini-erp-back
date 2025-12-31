import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { KitchenStatus } from '../enums/kitchen-status.enum';

export class UpdateKitchenStatusDto {
  @ApiProperty({ enum: KitchenStatus, example: KitchenStatus.PREPARING })
  @IsEnum(KitchenStatus)
  status: KitchenStatus;
}
