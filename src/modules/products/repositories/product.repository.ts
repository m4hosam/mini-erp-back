import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends GenericRepository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {
    super(productRepo);
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productRepo.findOne({ where: { sku } });
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.productRepo.findOne({ where: { barcode } });
  }

  async findLowStockProducts(): Promise<Product[]> {
    return this.productRepo
      .createQueryBuilder('product')
      .where('product.currentStock <= product.reorderLevel')
      .andWhere('product.isActive = :isActive', { isActive: true })
      .leftJoinAndSelect('product.category', 'category')
      .getMany();
  }
}
