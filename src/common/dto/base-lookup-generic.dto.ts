import { ApiProperty } from '@nestjs/swagger';

export class BaseLookupGenericDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'name' })
  name: string;
}
