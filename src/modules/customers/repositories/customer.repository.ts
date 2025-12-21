import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Customer } from '../entities/customer.entity';

@Injectable()
export class CustomerRepository extends GenericRepository<Customer> {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {
    super(customerRepo);
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.customerRepo.findOne({ where: { phone } });
  }

  async incrementOrdersCount(id: number): Promise<void> {
    await this.customerRepo.increment({ id }, 'totalOrdersCount', 1);
  }
}
