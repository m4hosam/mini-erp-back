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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { AdjustStockDto } from '../dto/adjust-stock.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { BaseLookupDto } from 'src/common/dto/base-lookup.dto';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponseWrapper(ProductResponseDto)
  async create(@Body() dto: CreateProductDto, @Req() req: any) {
    const userId = req.user?.sub;
    return this.productsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination and filters' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'IN_STOCK'],
  })
  @ApiResponseWrapper(ProductResponseDto, false, true)
  async findAll(
    @Query() filterDto: BaseFilterDto,
    @Query('categoryId') categoryId?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const { page, limit } = filterDto;
    return this.productsService.searchAndFilter(
      { page, limit },
      categoryId,
      search,
      status,
    );
  }

  @Get('lookup')
  @ApiOperation({ summary: 'Get product lookup list' })
  @ApiResponseWrapper(BaseLookupDto, true)
  async getLookup() {
    return this.productsService.getLookup();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponseWrapper(ProductResponseDto, true)
  async getLowStock() {
    return this.productsService.getLowStockProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponseWrapper(ProductResponseDto)
  async findOne(@Param('id') id: string) {
    return this.productsService.findById(+id);
  }

  @Patch(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponseWrapper(ProductResponseDto)
  async update(
    @Param('id') id: string,
    @Body() dto: CreateProductDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    const updateDto: UpdateProductDto = { ...dto, id: +id };
    return this.productsService.update(updateDto, userId);
  }

  @Post(':id/adjust-stock')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Adjust product stock' })
  @ApiResponseWrapper(ProductResponseDto)
  async adjustStock(
    @Param('id') id: string,
    @Body() dto: AdjustStockDto,
    @Req() req: any,
  ) {
    const userId = req.user?.sub;
    return this.productsService.adjustStock(+id, dto, userId);
  }

  @Delete(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin)
  @ApiOperation({ summary: 'Soft delete a product' })
  async remove(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.sub;
    await this.productsService.softDelete(+id, userId);
    return { message: 'Product deleted successfully' };
  }
}
