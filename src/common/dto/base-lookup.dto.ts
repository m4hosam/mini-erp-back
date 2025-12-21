import { ApiProperty } from '@nestjs/swagger';

export class BaseLookupDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'مشروبات' })
  nameAr: string;

  @ApiProperty({ example: 'Beverages' })
  nameEn: string;
}
