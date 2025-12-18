import { Entity, Column, Index } from 'typeorm';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';

@Entity({ name: 'users', schema: 'public' })
@Index(['username'])
@Index(['email'])
export class User extends BaseTransactionEntity {
  @Column({ type: 'varchar', length: 100, nullable: false, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName: string;

  @Column({ type: 'simple-array', nullable: true })
  roles: string[];

  @Column({ type: 'varchar', nullable: true })
  refreshToken?: string;
}
