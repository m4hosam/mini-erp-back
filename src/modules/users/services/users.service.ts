import { Injectable, ForbiddenException } from '@nestjs/common';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { GenericService } from '../../../common/services/generic.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserRepository } from '../repositories/user.repository';
import { plainToInstance } from 'class-transformer';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import * as bcrypt from 'bcrypt';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';

@Injectable()
export class UsersService extends GenericService<
  User,
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto
> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository, 'User');
  }

  toResponseDto(user: User): UserResponseDto {
    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  toEntity(dto: CreateUserDto | UpdateUserDto): Partial<User> {
    const entity: Partial<User> = {
      username: dto.username,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      roles: dto.roles,
    };

    if (dto.password) {
      entity.password = dto.password;
    }

    return entity;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async findEntityById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(dto: CreateUserDto, userId?: number): Promise<UserResponseDto> {
    if (userId) {
      const creator = await this.findById(userId);
      if (creator) {
        const creatorRoles = creator.roles;
        // Check permissions
        const allowedRoles = [
          RoleEnum.Manager,
          RoleEnum.DeliveryDriver,
          RoleEnum.Sales,
        ];

        if (creatorRoles.includes(RoleEnum.Admin)) {
          // Admin can create limited roles
          const hasForbiddenRole = dto.roles?.some(
            (role) => !allowedRoles.includes(role as RoleEnum),
          );
          if (hasForbiddenRole) {
            throw new ForbiddenException(ErrorMessages.InsufficientPermissions);
          }
        } else if (creatorRoles.includes(RoleEnum.Owner)) {
          // Owner can create Admin + others
          const ownerAllowed = [...allowedRoles, RoleEnum.Admin];
          const hasForbiddenRole = dto.roles?.some(
            (role) => !ownerAllowed.includes(role as RoleEnum),
          );
          if (hasForbiddenRole) {
            throw new ForbiddenException(ErrorMessages.InsufficientPermissions);
          }
        } else {
          // Other roles? Maybe shouldn't be here if guard blocks, but strictly enforcing:
          throw new ForbiddenException(ErrorMessages.InsufficientPermissions);
        }
      }
    }

    const existingUser = await this.userRepository.findByUsername(dto.username);
    if (existingUser) {
      throw new BusinessValidationException(
        ErrorMessages.UsernameAlreadyExists,
      );
    }

    const existingEmail = await this.userRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new BusinessValidationException(ErrorMessages.EmailAlreadyExists);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userDto = { ...dto, password: hashedPassword };

    return super.create(userDto, userId);
  }

  async updateRefreshToken(
    userId: number,
    refreshToken: string | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { refreshToken } as any);
  }
}
