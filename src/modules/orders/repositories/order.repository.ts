import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrderRepository extends GenericRepository<Order> {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {
    super(orderRepo);
  }

  // Helper to count orders for a specific day to generate ID
  async countOrdersByDate(date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.orderRepo
      .createQueryBuilder('order')
      .where('order.createdAt BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay,
      })
      .getCount();
  }
}
