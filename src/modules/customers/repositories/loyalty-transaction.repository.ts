import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { LoyaltyTransaction } from '../entities/loyalty-transaction.entity';

@Injectable()
export class LoyaltyTransactionRepository extends GenericRepository<LoyaltyTransaction> {
  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly loyaltyTransactionRepo: Repository<LoyaltyTransaction>,
  ) {
    super(loyaltyTransactionRepo);
  }

  /**
   * Find all loyalty transactions for a customer
   */
  async findByCustomerId(
    customerId: number,
    limit?: number,
  ): Promise<LoyaltyTransaction[]> {
    const query = this.loyaltyTransactionRepo
      .createQueryBuilder('transaction')
      .where('transaction.customer_id = :customerId', { customerId })
      .orderBy('transaction.created_at', 'DESC');

    if (limit) {
      query.take(limit);
    }

    return query.getMany();
  }

  /**
   * Calculate total points earned by customer
   */
  async calculateTotalPoints(customerId: number): Promise<number> {
    const result = await this.loyaltyTransactionRepo
      .createQueryBuilder('transaction')
      .select('SUM(transaction.points)', 'total')
      .where('transaction.customer_id = :customerId', { customerId })
      .getRawOne();

    return Number(result?.total) || 0;
  }
}
