import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GenericRepository } from '../../../common/repositories/generic.repository';
import { ModifierGroup } from '../entities/modifier-group.entity';

@Injectable()
export class ModifierGroupRepository extends GenericRepository<ModifierGroup> {
  constructor(
    @InjectRepository(ModifierGroup)
    private readonly modifierGroupRepo: Repository<ModifierGroup>,
  ) {
    super(modifierGroupRepo);
  }

  /**
   * Find modifier group with its modifiers
   */
  async findWithModifiers(id: number): Promise<ModifierGroup | null> {
    return this.modifierGroupRepo.findOne({
      where: { id },
      relations: ['modifiers'],
      order: {
        modifiers: {
          sortOrder: 'ASC',
        },
      },
    });
  }

  /**
   * Find all modifier groups with their modifiers
   */
  async findAllWithModifiers(): Promise<ModifierGroup[]> {
    return this.modifierGroupRepo.find({
      where: { isActive: true },
      relations: ['modifiers'],
      order: {
        sortOrder: 'ASC',
        modifiers: {
          sortOrder: 'ASC',
        },
      },
    });
  }
}
