import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/services/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokensDto } from '../dto/tokens.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<TokensDto & { user: any }> {
    const user = await this.usersService.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.InvalidCredentials);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ErrorMessages.UserInactive);
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.InvalidCredentials);
    }

    const tokens = await this.generateTokens(
      user.id,
      user.username,
      user.email,
      user.role,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<{ user: any }> {
    const user = await this.usersService.create(registerDto);
    return { user };
  }

  async refreshTokens(
    userId: number,
    refreshToken: string,
    refreshJti: string,
  ): Promise<TokensDto & { user: any }> {
    const user = await this.usersService.findEntityById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException(ErrorMessages.InvalidRefreshToken);
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException(ErrorMessages.InvalidRefreshToken);
    }

    const tokens = await this.generateTokens(
      user.id,
      user.username,
      user.email,
      user.role,
    );

    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
      },
    };
  }

  async logout(userId: number): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  private async generateTokens(
    userId: number,
    username: string,
    email: string, // Add email to args
    role: string,
  ): Promise<TokensDto> {
    const refreshJti = crypto.randomUUID();
    const payload = { sub: userId, username, email, role };
    const refreshPayload = { ...payload, jti: refreshJti };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_ACCESS_EXPIRATION',
          '15m',
        ) as any,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>(
          'JWT_REFRESH_EXPIRATION',
          '7d',
        ) as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(
    userId: number,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }
}
