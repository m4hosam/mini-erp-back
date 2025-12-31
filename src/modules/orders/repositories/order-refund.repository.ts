import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { OrderRefund } from '../entities/order-refund.entity';

@Injectable()
export class OrderRefundRepository extends GenericRepository<OrderRefund> {
  constructor(
    @InjectRepository(OrderRefund)
    private readonly repo: Repository<OrderRefund>,
  ) {
    super(repo);
  }
}
