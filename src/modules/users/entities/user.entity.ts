import { Entity, Column, Index } from 'typeorm';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { RoleEnum } from '../../../common/enums/roles.enum';

@Entity({ name: 'users', schema: 'public' })
// @Index(['username'])
@Index(['email'])
export class User extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: RoleEnum, default: RoleEnum.DELIVERY_DRIVER })
  role: RoleEnum;

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string;
}
