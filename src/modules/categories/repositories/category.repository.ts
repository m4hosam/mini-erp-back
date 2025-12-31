import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoryRepository extends GenericRepository<Category> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {
    super(categoryRepo);
  }

  async findTree(): Promise<Category[]> {
    return this.categoryRepo.manager.getTreeRepository(Category).findTrees();
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return this.categoryRepo.findOne({ where: { slug } });
  }


}
