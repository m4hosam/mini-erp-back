import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { Modifier } from '../entities/modifier.entity';

@Injectable()
export class ModifierRepository extends GenericRepository<Modifier> {
  constructor(
    @InjectRepository(Modifier)
    private readonly modifierRepo: Repository<Modifier>,
  ) {
    super(modifierRepo);
  }

  /**
   * Find all modifiers for a specific group
   */
  async findByGroupId(groupId: number): Promise<Modifier[]> {
    return this.modifierRepo.find({
      where: { groupId, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }
}
