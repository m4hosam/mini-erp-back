import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { CashDrop } from '../entities/cash-drop.entity';

@Injectable()
export class CashDropRepository extends GenericRepository<CashDrop> {
  constructor(
    @InjectRepository(CashDrop)
    private readonly cashDropRepo: Repository<CashDrop>,
  ) {
    super(cashDropRepo);
  }

  /**
   * Find all cash drops for a session
   */
  async findBySessionId(sessionId: number): Promise<CashDrop[]> {
    return this.cashDropRepo.find({
      where: { sessionId },
      relations: ['user'],
      order: { droppedAt: 'ASC' },
    });
  }

  /**
   * Calculate total drops for a session
   */
  async calculateTotalDrops(sessionId: number): Promise<number> {
    const result = await this.cashDropRepo
      .createQueryBuilder('drop')
      .select('SUM(drop.amount)', 'total')
      .where('drop.session_id = :sessionId', { sessionId })
      .getRawOne();

    return Number(result?.total) || 0;
  }
}
