import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@ApiTags('Users')
@Controller('users')
// @UseGuards(JwtAuthGuard, RolesGuard)
// @ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  // @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponseWrapper(UserResponseDto, true, true)
  async findAll(
    @Query() filterDto: BaseFilterDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;

    return this.usersService.findWithPagination(
      { page, limit },
      {
        where: filters as any,
        order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
      },
    );
  }

  @Get(':id')
  @Roles(RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'User ID' })
  @ApiResponseWrapper(UserResponseDto)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponseWrapper(UserResponseDto)
  async create(
    @Body() createDto: CreateUserDto,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const userId = req.user?.id;
    return this.usersService.create(createDto, userId);
  }

  @Put()
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Update user' })
  @ApiResponseWrapper(UserResponseDto)
  async update(
    @Body() updateDto: UpdateUserDto,
    @Req() req: any,
  ): Promise<UserResponseDto> {
    const userId = req.user?.id;
    return this.usersService.update(updateDto, userId);
  }

  @Delete(':id')
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Delete user' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.delete(id);
  }
}
