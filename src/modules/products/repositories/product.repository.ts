import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductRepository extends GenericRepository<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly repo: Repository<Product>,
  ) {
    super(repo);
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.repo.findOne({ where: { sku } });
  }

  async findLowStock(): Promise<Product[]> {
    return this.repo
      .createQueryBuilder('product')
      .where('product.currentStock <= product.reorderLevel')
      .getMany();
  }
}
