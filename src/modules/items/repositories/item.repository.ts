import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Item } from '../entities/item.entity';

@Injectable()
export class ItemRepository extends GenericRepository<Item> {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
  ) {
    super(itemRepository);
  }

  async findBySku(sku: string): Promise<Item | null> {
    return this.itemRepository.findOne({ where: { sku } });
  }
}
