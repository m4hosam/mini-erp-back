import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { PettyCash } from '../entities/petty-cash.entity';

@Injectable()
export class PettyCashRepository extends GenericRepository<PettyCash> {
  constructor(
    @InjectRepository(PettyCash)
    private readonly pettyCashRepo: Repository<PettyCash>,
  ) {
    super(pettyCashRepo);
  }

  /**
   * Find all petty cash for a session
   */
  async findBySessionId(sessionId: number): Promise<PettyCash[]> {
    return this.pettyCashRepo.find({
      where: { sessionId },
      relations: ['user'],
      order: { paidAt: 'ASC' },
    });
  }

  /**
   * Calculate total petty cash for a session
   */
  async calculateTotalPettyCash(sessionId: number): Promise<number> {
    const result = await this.pettyCashRepo
      .createQueryBuilder('petty')
      .select('SUM(petty.amount)', 'total')
      .where('petty.session_id = :sessionId', { sessionId })
      .getRawOne();

    return Number(result?.total) || 0;
  }
}
