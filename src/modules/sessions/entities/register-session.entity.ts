import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { User } from '../../users/entities/user.entity';
import { CashDrop } from './cash-drop.entity';
import { PettyCash } from './petty-cash.entity';

/**
 * Register Session entity.
 * Tracks cash register shifts with opening/closing balances and reconciliation.
 */
@Entity({ name: 'register_sessions' })
export class RegisterSession extends BaseTransactionEntity {
  @ApiProperty({ example: 'POS-01', description: 'Device/Register identifier' })
  @Column({ name: 'device_id' })
  deviceId: string;

  @ApiProperty({ description: 'User who opened the session' })
  @Column({ name: 'user_id' })
  userId: number;

  @ApiProperty({
    example: 1000.0,
    description: 'Cash amount in drawer when session opened',
  })
  @Column({
    name: 'opening_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  openingBalance: number;

  @ApiProperty({
    example: 2500.0,
    description: 'Cash amount in drawer when session closed',
    required: false,
  })
  @Column({
    name: 'closing_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  closingBalance: number | null;

  @ApiProperty({
    example: 2450.0,
    description: 'Expected cash based on transactions',
    required: false,
  })
  @Column({
    name: 'expected_balance',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  expectedBalance: number | null;

  @ApiProperty({
    example: -50.0,
    description: 'Difference between expected and actual (negative = shortage)',
    required: false,
  })
  @Column({
    name: 'discrepancy',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  discrepancy: number | null;

  @ApiProperty({ example: true, description: 'Whether session is currently open' })
  @Column({ name: 'is_open', default: true })
  isOpen: boolean;

  @ApiProperty({ description: 'When session was opened' })
  @Column({ name: 'opened_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  openedAt: Date;

  @ApiProperty({ description: 'When session was closed', required: false })
  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @ApiProperty({ description: 'User who closed the session', required: false })
  @Column({ name: 'closed_by', nullable: true })
  closedBy: number | null;

  @ApiProperty({
    example: 'End of shift',
    description: 'Notes about session',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closed_by' })
  closedByUser: User | null;

  @OneToMany(() => CashDrop, (drop) => drop.session)
  cashDrops: CashDrop[];

  @OneToMany(() => PettyCash, (petty) => petty.session)
  pettyCashTransactions: PettyCash[];
}
