import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { TokensDto } from '../dto/tokens.dto';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../../common/decorators/public.decorator';
import { RegisterDto } from '../dto/register.dto';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    return {
      message: 'Login successful',
      user: tokens.user, // Return user info as well? Requirement says "Login and return JWT token".
      // Usually returning user details is helpful for frontend.
      // But my AuthService.login returns { ...tokens, user: ... }
      // So I can return tokens and user if I want, or just message.
      // But I am setting cookies.
      // Let's return the user object in the body for convenience if needed, or just success.
      // Existing code returned { message: 'Login successful' }.
      // I will keep it simple but maybe expose user if needed.
      // Let's stick to existing pattern but maybe add user data if useful.
      // Requirement: "return JWT token".
      // If cookies are used, maybe token in body is optional?
      // "Include userId and role in JWT payload" - that's for parsing.
      // "POST /auth/login - Login and return JWT token".
      // If I set cookies, I am effectively returning it.
      // But maybe I should also return the access token in body for mobile apps?
      accessToken: tokens.accessToken,
    };
  }

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.Owner)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register new user (Owner only)' })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<any> {
    const result = await this.authService.register(registerDto);
    return { message: 'User registered successfully', user: result.user };
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: any): Promise<any> {
    // req.user is set by JwtStrategy
    return req.user;
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
