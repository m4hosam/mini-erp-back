import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { StoreCreditTransaction } from '../entities/store-credit-transaction.entity';

@Injectable()
export class StoreCreditTransactionRepository extends GenericRepository<StoreCreditTransaction> {
  constructor(
    @InjectRepository(StoreCreditTransaction)
    private readonly storeCreditTransactionRepo: Repository<StoreCreditTransaction>,
  ) {
    super(storeCreditTransactionRepo);
  }

  /**
   * Find all store credit transactions for a customer
   */
  async findByCustomerId(
    customerId: number,
    limit?: number,
  ): Promise<StoreCreditTransaction[]> {
    const query = this.storeCreditTransactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.customer_id = :customerId', { customerId })
      .orderBy('transaction.created_at', 'DESC');

    if (limit) {
      query.take(limit);
    }

    return query.getMany();
  }

  /**
   * Calculate total credit balance for customer
   */
  async calculateBalance(customerId: number): Promise<number> {
    const result = await this.storeCreditTransactionRepo
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.customer_id = :customerId', { customerId })
      .getRawOne();

    return Number(result?.total) || 0;
  }
}
