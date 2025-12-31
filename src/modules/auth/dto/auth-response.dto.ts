import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { TokensDto } from './tokens.dto';

export class AuthResponseDto extends TokensDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
