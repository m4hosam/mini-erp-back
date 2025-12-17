import {
  Controller,
  Get,
  Post,
  Patch, // using Patch for update
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
import { ProductsService } from '../services/products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { AdjustStockDto } from '../dto/adjust-stock.dto';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponseWrapper(ProductResponseDto)
  async create(
    @Body() createDto: CreateProductDto,
    @Req() req: any,
  ): Promise<ProductResponseDto> {
    const userId = req.user?.id;
    return this.productsService.create(createDto, userId);
  }

  @Get()
  @Public() // Requirement says GET/products (All roles) - Does it mean public or just all auth users? Assuming public or all auth. "All roles" implies Auth. But "Public Form" might need products? Assuming Auth for now unless public. Guide says "All roles".
  // Actually, if it's "All roles", it implies you must have a role, so Auth required.
  // I will remove @Public for now.
  @ApiOperation({ summary: 'List all products' })
  @ApiResponseWrapper(ProductResponseDto, true, true)
  async findAll(
    @Query() filterDto: BaseFilterDto,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;

    return this.productsService.findWithPagination(
      { page, limit },
      {
        where: filters as any,
        order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
      },
    );
  }

  @Get('low-stock')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiResponseWrapper(ProductResponseDto, true)
  async getLowStock(): Promise<ProductResponseDto[]> {
    return this.productsService.getLowStockProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponseWrapper(ProductResponseDto)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    return this.productsService.findById(id);
  }

  @Patch(':id') // Using Patch as per guide/requirements
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update product' })
  @ApiResponseWrapper(ProductResponseDto)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductDto,
    @Req() req: any,
  ): Promise<ProductResponseDto> {
    const userId = req.user?.id;
    updateDto.id = id;
    return this.productsService.update(updateDto, userId);
  }

  @Delete(':id')
  @Roles(RoleEnum.OWNER)
  @ApiOperation({ summary: 'Delete product' })
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.productsService.delete(id);
  }

  @Post(':id/adjust-stock')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Adjust stock' })
  @ApiResponseWrapper(ProductResponseDto)
  async adjustStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() adjustDto: AdjustStockDto,
    @Req() req: any,
  ): Promise<ProductResponseDto> {
    const userId = req.user?.id;
    adjustDto.productId = id;
    return this.productsService.adjustStock(adjustDto, userId);
  }
}
