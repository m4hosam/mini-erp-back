import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { BaseLookupDto } from '../../../common/dto/base-lookup.dto';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponseWrapper(CategoryResponseDto)
  async create(@Body() dto: CreateCategoryDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.categoriesService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories with pagination' })
  @ApiResponseWrapper(CategoryResponseDto, false, true)
  async findAll(@Query() filterDto: BaseFilterDto) {
    const { page, limit } = filterDto;
    return this.categoriesService.findWithPagination(
      { page, limit },
      { where: { isActive: true }, relations: ['parent'] },
    );
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get category tree structure' })
  @ApiResponseWrapper(CategoryResponseDto, true)
  async getTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Get category lookup list' })
  @ApiResponseWrapper(BaseLookupDto, true)
  async getLookup() {
    return this.categoriesService.getLookup();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponseWrapper(CategoryResponseDto)
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponseWrapper(CategoryResponseDto)
  async update(
    @Param('id') id: string,
    @Body() dto: CreateCategoryDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    const updateDto: UpdateCategoryDto = { ...dto, id: +id };
    return this.categoriesService.update(updateDto, userId);
  }

  @Delete(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin)
  @ApiOperation({ summary: 'Soft delete a category' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub;
    await this.categoriesService.softDelete(+id, userId);
    return { message: 'Category deleted successfully' };
  }
}
