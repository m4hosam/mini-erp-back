import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { RegisterSession } from '../entities/register-session.entity';

@Injectable()
export class RegisterSessionRepository extends GenericRepository<RegisterSession> {
  constructor(
    @InjectRepository(RegisterSession)
    private readonly sessionRepo: Repository<RegisterSession>,
  ) {
    super(sessionRepo);
  }

  /**
   * Find active session for a device
   */
  async findActiveByDevice(deviceId: string): Promise<RegisterSession | null> {
    return this.sessionRepo.findOne({
      where: { deviceId, isOpen: true },
      relations: ['user', 'cashDrops', 'pettyCashTransactions'],
      order: { openedAt: 'DESC' },
    });
  }

  /**
   * Find session with all relations
   */
  async findWithRelations(id: number): Promise<RegisterSession | null> {
    return this.sessionRepo.findOne({
      where: { id },
      relations: ['user', 'closedByUser', 'cashDrops', 'pettyCashTransactions'],
    });
  }
}
