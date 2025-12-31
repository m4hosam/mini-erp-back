import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { OrderPayment } from '../entities/order-payment.entity';

@Injectable()
export class OrderPaymentRepository extends GenericRepository<OrderPayment> {
  constructor(
    @InjectRepository(OrderPayment)
    private readonly repo: Repository<OrderPayment>,
  ) {
    super(repo);
  }
}
