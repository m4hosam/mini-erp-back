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
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: dto.role,
    };

    if (dto.password) {
      entity.password = dto.password;
    }

    return entity;
  }

  async findEntityById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async create(dto: CreateUserDto, userId?: number): Promise<UserResponseDto> {
    if (userId) {
      const creator = await this.findById(userId);
      if (creator) {
        const creatorRole = creator.role;
        const targetRole = dto.role || RoleEnum.DELIVERY_DRIVER;

        // Permission Logic
        if (creatorRole === RoleEnum.ADMIN) {
          const allowedRoles = [RoleEnum.MANAGER, RoleEnum.DELIVERY_DRIVER];
          if (!allowedRoles.includes(targetRole)) {
            throw new ForbiddenException(ErrorMessages.InsufficientPermissions);
          }
        } else if (creatorRole === RoleEnum.OWNER) {
          const allowedRoles = [
            RoleEnum.ADMIN,
            RoleEnum.MANAGER,
            RoleEnum.DELIVERY_DRIVER,
            RoleEnum.OWNER,
          ];
          if (!allowedRoles.includes(targetRole)) {
            throw new ForbiddenException(ErrorMessages.InsufficientPermissions);
          }
        } else {
          throw new ForbiddenException(ErrorMessages.InsufficientPermissions);
        }
      }
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
