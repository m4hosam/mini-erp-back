import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleEnum } from '../../../common/enums/roles.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: 'INVALID_EMAIL' })
  @IsNotEmpty({ message: 'EMAIL_REQUIRED' })
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'PASSWORD_REQUIRED' })
  @MinLength(6, { message: 'PASSWORD_TOO_SHORT' })
  password: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'FIRST_NAME_REQUIRED' })
  firstName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'LAST_NAME_REQUIRED' })
  lastName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'PHONE_REQUIRED' })
  phone: string;

  @ApiProperty({ enum: RoleEnum, default: RoleEnum.DELIVERY_DRIVER })
  @IsOptional()
  @IsEnum(RoleEnum, { message: 'INVALID_ROLE' })
  role?: RoleEnum;
}
