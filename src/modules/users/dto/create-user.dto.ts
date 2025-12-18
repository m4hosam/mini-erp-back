import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'USERNAME_REQUIRED' })
  username: string;

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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  roles?: string[];
}
