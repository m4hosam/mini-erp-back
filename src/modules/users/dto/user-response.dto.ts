import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { RoleEnum } from '../../../common/enums/roles.enum';

export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: number;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @Expose()
  phone: string;

  @ApiProperty({ enum: RoleEnum })
  @Expose()
  role: RoleEnum;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Expose()
  @Type(() => Date)
  updatedAt: Date;
}
