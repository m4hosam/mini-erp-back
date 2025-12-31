import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { OrderItemModifier } from '../entities/order-item-modifier.entity';

@Injectable()
export class OrderItemModifierRepository extends GenericRepository<OrderItemModifier> {
  constructor(
    @InjectRepository(OrderItemModifier)
    private readonly repo: Repository<OrderItemModifier>,
  ) {
    super(repo);
  }
}
