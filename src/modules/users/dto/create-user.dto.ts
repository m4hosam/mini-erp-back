import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsEnum,
  MinLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoleEnum } from '../../../common/enums/roles.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: 'EMAIL_INVALID' })
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: RoleEnum })
  @IsEnum(RoleEnum, { message: 'INVALID_ROLE' })
  @IsNotEmpty({ message: 'ROLE_REQUIRED' })
  role: RoleEnum;
}
