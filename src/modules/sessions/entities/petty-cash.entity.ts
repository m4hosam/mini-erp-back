import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { RegisterSession } from './register-session.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Petty Cash entity.
 * Records small expenses paid from cash register during shift.
 * Examples: supplies, tips, small vendor payments.
 */
@Entity({ name: 'petty_cash' })
export class PettyCash extends BaseTransactionEntity {
  @ApiProperty({ description: 'Register session ID' })
  @Column({ name: 'session_id' })
  sessionId: number;

  @ApiProperty({ example: 25.0, description: 'Amount paid out' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({ example: 'Office supplies', description: 'Reason for expense' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'When expense was paid' })
  @Column({ name: 'paid_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  paidAt: Date;

  @ApiProperty({ description: 'User who authorized payment' })
  @Column({ name: 'paid_by' })
  paidBy: number;

  // Relationships
  @ManyToOne(() => RegisterSession, (session) => session.pettyCashTransactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: RegisterSession;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'paid_by' })
  user: User;
}
