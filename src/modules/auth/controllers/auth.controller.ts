import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { TokensDto } from '../dto/tokens.dto';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../../common/decorators/public.decorator';
import { UsersService } from '../../users/services/users.service';
import { RegisterDto } from '../dto/register.dto';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(RoleEnum.OWNER)
  @ApiOperation({ summary: 'Register new user (Owner only)' })
  @ApiResponseWrapper(UserResponseDto)
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const userId = req.user?.id;
    return this.usersService.create(registerDto, userId);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  // @ApiResponseWrapper(TokensDto) // validating response body might fail if empty or different
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    const tokens = await this.authService.login(loginDto);
    this.setCookies(res, tokens);
    return { message: 'Login successful' };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh tokens' })
  // @ApiResponseWrapper(TokensDto)
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    const userId = req.user['id'];
    const refreshToken = req.user['refreshToken'];
    const refreshJti = req.user['jti'];
    const tokens = await this.authService.refreshTokens(
      userId,
      refreshToken,
      refreshJti,
    );
    this.setCookies(res, tokens);
    return { message: 'Tokens refreshed' };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<any> {
    const userId = req.user['id'];
    await this.authService.logout(userId);
    this.clearCookies(res);
    return { message: 'Logout successful' };
  }

  private setCookies(res: Response, tokens: TokensDto & { user: any }) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.cookie('user_details', JSON.stringify(tokens.user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  private clearCookies(res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('user_details');
  }
}
