import { Injectable, NotFoundException } from '@nestjs/common';
import { GenericService } from '../../../common/services/generic.service';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductRepository } from '../repositories/product.repository';
import { plainToInstance } from 'class-transformer';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';
import { AdjustStockDto, StockAdjustmentType } from '../dto/adjust-stock.dto';

@Injectable()
export class ProductsService extends GenericService<
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto
> {
  constructor(private readonly productRepository: ProductRepository) {
    super(productRepository, 'Product');
  }

  toResponseDto(product: Product): ProductResponseDto {
    const dto = plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });

    // Compute stock status
    if (product.currentStock <= 0) {
      dto.stockStatus = 'OUT_OF_STOCK';
    } else if (product.currentStock <= product.reorderLevel) {
      dto.stockStatus = 'LOW_STOCK';
    } else {
      dto.stockStatus = 'IN_STOCK';
    }

    return dto;
  }

  toEntity(dto: CreateProductDto | UpdateProductDto): Partial<Product> {
    const entity: Partial<Product> = { ...dto };
    return entity;
  }

  async findEntityById(id: number): Promise<Product | null> {
    return this.productRepository.findById(id);
  }

  async create(
    dto: CreateProductDto,
    userId?: number,
  ): Promise<ProductResponseDto> {
    await this.validateUniqueSku(dto.sku);
    return super.create(dto, userId);
  }

  async update(
    dto: UpdateProductDto,
    userId?: number,
  ): Promise<ProductResponseDto> {
    if (dto.sku) {
      // Retrieve existing product to check if SKU changed
      const existing = await this.productRepository.findById(dto.id);
      if (existing && existing.sku !== dto.sku) {
        await this.validateUniqueSku(dto.sku);
      }
    }
    return super.update(dto, userId);
  }

  async validateUniqueSku(sku: string): Promise<void> {
    const existing = await this.productRepository.findBySku(sku);
    if (existing) {
      throw new BusinessValidationException(ErrorMessages.SkuAlreadyExists);
    }
  }

  async checkStockAvailability(
    productId: number,
    requestedQuantity: number,
  ): Promise<boolean> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException(ErrorMessages.ProductNotFound);
    }
    return product.currentStock >= requestedQuantity;
  }

  async adjustStock(
    dto: AdjustStockDto,
    userId?: number,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(dto.productId);
    if (!product) {
      throw new NotFoundException(ErrorMessages.ProductNotFound);
    }

    let newStock = Number(product.currentStock);
    const quantity = Number(dto.quantity);

    if (dto.type === StockAdjustmentType.ADD) {
      newStock += quantity;
    } else {
      if (newStock < quantity) {
        throw new BusinessValidationException(ErrorMessages.InsufficientStock);
      }
      newStock -= quantity;
    }

    await this.productRepository.update(product.id, {
      currentStock: newStock,
      updatedBy: userId,
    } as any);

    const updatedProduct = await this.productRepository.findById(product.id);
    return this.toResponseDto(updatedProduct!);
  }

  async getLowStockProducts(): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findLowStock();
    return products.map((p) => this.toResponseDto(p));
  }
}
