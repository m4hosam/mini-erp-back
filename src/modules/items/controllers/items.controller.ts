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
import { ItemsService } from '../services/items.service';
import { CreateItemDto } from '../dto/create-item.dto';
import { UpdateItemDto } from '../dto/update-item.dto';
import { ItemResponseDto } from '../dto/item-response.dto';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { Public } from '../../../common/decorators/public.decorator';
import { RoleEnum } from 'src/common/enums/roles.enum';

@ApiTags('Items')
@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all items with pagination' })
  @ApiResponseWrapper(ItemResponseDto, true, true)
  async findAll(
    @Query() filterDto: BaseFilterDto,
  ): Promise<PaginatedResult<ItemResponseDto>> {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;

    return this.itemsService.findWithPagination(
      { page, limit },
      {
        where: filters as any,
        order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
      },
    );
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get item by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Item ID' })
  @ApiResponseWrapper(ItemResponseDto)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ItemResponseDto> {
    return this.itemsService.findById(id);
  }

  @Post()
  @Roles(RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Create new item' })
  @ApiResponseWrapper(ItemResponseDto)
  async create(
    @Body() createDto: CreateItemDto,
    @Req() req: any,
  ): Promise<ItemResponseDto> {
    const userId = req.user?.id;
    return this.itemsService.create(createDto, userId);
  }

  @Put()
  @Roles(RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Update item' })
  @ApiResponseWrapper(ItemResponseDto)
  async update(
    @Body() updateDto: UpdateItemDto,
    @Req() req: any,
  ): Promise<ItemResponseDto> {
    const userId = req.user?.id;
    return this.itemsService.update(updateDto, userId);
  }

  @Delete(':id')
  @Roles(RoleEnum.Admin)
  @ApiOperation({ summary: 'Delete item' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.itemsService.delete(id);
  }
}
