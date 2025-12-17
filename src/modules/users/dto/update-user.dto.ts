import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'User ID to update' })
  @IsInt({ message: 'USER_ID_MUST_BE_NUMBER' })
  @IsNotEmpty({ message: 'USER_ID_REQUIRED' })
  id: number;
}
