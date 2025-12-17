import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderRepository extends GenericRepository<Order> {
  constructor(
    @InjectRepository(Order)
    private readonly repo: Repository<Order>,
  ) {
    super(repo);
  }

  async findWithItems(id: number): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'driver'],
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.repo.findOne({ where: { orderNumber } });
  }

  // Override generic find to include relations often? Or stick to specific methods.
}
