import { Injectable, Logger } from '@nestjs/common';
import { GenericService } from '../../../common/services/generic.service';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { AdjustStockDto, StockAdjustmentType } from '../dto/adjust-stock.dto';
import { ProductRepository } from '../repositories/product.repository';
import { CategoriesService } from '../../categories/services/categories.service';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';
import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import { FindManyOptions, ILike } from 'typeorm';
import {
  IPaginationOptions,
  PaginatedResult,
} from '../../../common/interfaces/pagination.interface';

@Injectable()
export class ProductsService extends GenericService<
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto
> {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly productRepo: ProductRepository,
    private readonly categoriesService: CategoriesService,
  ) {
    super(productRepo, 'Product');
  }

  toResponseDto(entity: Product): ProductResponseDto {
    // Calculate stock status
    let stockStatus = 'IN_STOCK';
    if (entity.currentStock <= 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (entity.currentStock <= entity.reorderLevel) {
      stockStatus = 'LOW_STOCK';
    }

    // Calculate margin: ((salePrice - costPrice) / salePrice) * 100
    const margin =
      entity.salePrice > 0
        ? ((Number(entity.salePrice) - Number(entity.costPrice)) /
          Number(entity.salePrice)) *
        100
        : 0;

    return {
      id: entity.id,
      sku: entity.sku,
      barcode: entity.barcode,
      nameAr: entity.nameAr,
      nameEn: entity.nameEn,
      description: entity.description,
      costPrice: Number(entity.costPrice),
      salePrice: Number(entity.salePrice),
      unit: entity.unit,
      currentStock: Number(entity.currentStock),
      reorderLevel: Number(entity.reorderLevel),
      categoryId: entity.category?.id,
      categoryNameAr: entity.category?.nameAr,
      categoryNameEn: entity.category?.nameEn,
      imageUrl: entity.imageUrl,
      isActive: entity.isActive,
      shelfLifeDays: entity.shelfLifeDays,
      requiresColdStorage: entity.requiresColdStorage,
      stockStatus,
      margin: Number(margin.toFixed(2)),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdBy: entity.createdBy,
      updatedBy: entity.updatedBy,
    };
  }

  toEntity(dto: CreateProductDto | UpdateProductDto): Partial<Product> {
    const entity: Partial<Product> = {
      sku: dto.sku,
      barcode: dto.barcode,
      nameAr: dto.nameAr,
      nameEn: dto.nameEn,
      description: dto.description,
      costPrice: dto.costPrice,
      salePrice: dto.salePrice,
      unit: dto.unit,
      reorderLevel: dto.reorderLevel,
      imageUrl: dto.imageUrl,
      shelfLifeDays: dto.shelfLifeDays,
      requiresColdStorage: dto.requiresColdStorage,
    };

    return entity;
  }

  async create(
    dto: CreateProductDto,
    userId?: number,
  ): Promise<ProductResponseDto> {
    // Validate unique SKU
    await this.validateUniqueIdentifiers(dto.sku, dto.barcode);

    // Validate category exists if provided
    let category;
    if (dto.categoryId) {
      category = await this.categoriesService.findById(dto.categoryId);
      // findById throws NotFoundException if not found, so we have the category here
    }

    // Log warning if sale price is less than cost price
    if (dto.salePrice < dto.costPrice) {
      this.logger.warn(
        `Product ${dto.sku} has sale price (${dto.salePrice}) less than cost price (${dto.costPrice}). This may result in losses.`,
      );
    }

    const entityData = this.toEntity(dto);
    if (userId) {
      entityData.createdBy = userId;
    }
    if (category) {
      entityData.category = { id: dto.categoryId } as any;
    }

    const entity = await this.productRepo.create(entityData);

    // Fetch with relations to return complete response
    const savedProduct = await this.productRepo.findById(entity.id, {
      relations: ['category'],
    });

    return this.toResponseDto(savedProduct!);
  }

  async update(
    dto: UpdateProductDto,
    userId?: number,
  ): Promise<ProductResponseDto> {
    const id = dto.id;

    const existingEntity = await this.productRepo.findById(id, {
      relations: ['category'],
    });
    if (!existingEntity) {
      throw new NotFoundException(ErrorMessages.ProductNotFound);
    }

    // Validate unique SKU if changed
    if (dto.sku && dto.sku !== existingEntity.sku) {
      const existingBySku = await this.productRepo.findBySku(dto.sku);
      if (existingBySku) {
        throw new BusinessValidationException(ErrorMessages.SkuAlreadyExists);
      }
    }

    // Validate unique barcode if changed
    if (dto.barcode && dto.barcode !== existingEntity.barcode) {
      const existingByBarcode = await this.productRepo.findByBarcode(
        dto.barcode,
      );
      if (existingByBarcode && existingByBarcode.id !== id) {
        throw new BusinessValidationException(
          ErrorMessages.BarcodeAlreadyExists,
        );
      }
    }

    // Validate category exists if provided
    if (dto.categoryId !== undefined) {
      if (dto.categoryId !== null) {
        await this.categoriesService.findById(dto.categoryId);
      }
    }

    // Log warning if sale price is less than cost price
    const newSalePrice = dto.salePrice ?? existingEntity.salePrice;
    const newCostPrice = dto.costPrice ?? existingEntity.costPrice;
    if (newSalePrice < newCostPrice) {
      this.logger.warn(
        `Product ${dto.sku || existingEntity.sku} has sale price (${newSalePrice}) less than cost price (${newCostPrice}). This may result in losses.`,
      );
    }

    const entityData = this.toEntity(dto);
    if (userId) {
      entityData.updatedBy = userId;
    }
    if (dto.categoryId !== undefined) {
      entityData.category = dto.categoryId
        ? ({ id: dto.categoryId } as any)
        : null;
    }

    const updatedEntity = await this.productRepo.update(id, entityData);
    if (!updatedEntity) {
      throw new NotFoundException(ErrorMessages.ProductNotFound);
    }

    // Fetch with relations to return complete response
    const savedProduct = await this.productRepo.findById(id, {
      relations: ['category'],
    });

    return this.toResponseDto(savedProduct!);
  }

  async adjustStock(
    id: number,
    dto: AdjustStockDto,
    userId?: number,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundException(ErrorMessages.ProductNotFound);
    }

    let newStock = Number(product.currentStock);

    switch (dto.type) {
      case StockAdjustmentType.ADD:
        newStock += dto.quantity;
        break;
      case StockAdjustmentType.REMOVE:
        if (newStock - dto.quantity < 0) {
          throw new BusinessValidationException(
            ErrorMessages.InsufficientStock,
          );
        }
        newStock -= dto.quantity;
        break;
      case StockAdjustmentType.SET:
        newStock = dto.quantity;
        break;
      default:
        throw new BusinessValidationException(
          ErrorMessages.InvalidStockAdjustment,
        );
    }

    await this.productRepo.update(id, {
      currentStock: newStock,
      updatedBy: userId,
    });

    this.logger.log(
      `Stock adjusted for product ${product.sku}: ${dto.type} ${dto.quantity}. New stock: ${newStock}. Reason: ${dto.reason}`,
    );

    const updatedProduct = await this.productRepo.findById(id, {
      relations: ['category'],
    });

    return this.toResponseDto(updatedProduct!);
  }

  async getLowStockProducts(): Promise<ProductResponseDto[]> {
    const products = await this.productRepo.findLowStockProducts();
    return products.map((product) => this.toResponseDto(product));
  }

  async searchAndFilter(
    paginationOptions: IPaginationOptions,
    categoryId?: number,
    search?: string,
    status?: string,
  ): Promise<PaginatedResult<ProductResponseDto>> {
    const findOptions: FindManyOptions<Product> = {
      where: { isActive: true },
      relations: ['category'],
    };

    // Build query using query builder for complex filters
    const queryBuilder = this.productRepo.getQueryBuilder('product');
    queryBuilder.leftJoinAndSelect('product.category', 'category');
    queryBuilder.where('product.isActive = :isActive', { isActive: true });

    // Filter by category
    if (categoryId) {
      queryBuilder.andWhere('product.category_id = :categoryId', {
        categoryId,
      });
    }

    // Search by name, SKU, or barcode
    if (search) {
      queryBuilder.andWhere(
        '(product.nameAr ILIKE :search OR product.nameEn ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by stock status
    if (status === 'LOW_STOCK') {
      queryBuilder.andWhere('product.currentStock <= product.reorderLevel');
      queryBuilder.andWhere('product.currentStock > 0');
    } else if (status === 'OUT_OF_STOCK') {
      queryBuilder.andWhere('product.currentStock <= 0');
    } else if (status === 'IN_STOCK') {
      queryBuilder.andWhere('product.currentStock > product.reorderLevel');
    }

    // Apply pagination
    const { page = 1, limit = 10 } = paginationOptions;
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map((item) => this.toResponseDto(item)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async validateUniqueIdentifiers(
    sku: string,
    barcode?: string,
  ): Promise<void> {
    const existingBySku = await this.productRepo.findBySku(sku);
    if (existingBySku) {
      throw new BusinessValidationException(ErrorMessages.SkuAlreadyExists);
    }

    if (barcode) {
      const existingByBarcode = await this.productRepo.findByBarcode(barcode);
      if (existingByBarcode) {
        throw new BusinessValidationException(
          ErrorMessages.BarcodeAlreadyExists,
        );
      }
    }
  }
}
