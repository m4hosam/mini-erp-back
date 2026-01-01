import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseTransactionEntity } from '../../../common/entities/base-transaction.entity';
import { RegisterSession } from './register-session.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Cash Drop entity.
 * Records when cash is removed from register and dropped into safe during shift.
 * Used to reduce cash in drawer for security.
 */
@Entity({ name: 'cash_drops' })
export class CashDrop extends BaseTransactionEntity {
  @ApiProperty({ description: 'Register session ID' })
  @Column({ name: 'session_id' })
  sessionId: number;

  @ApiProperty({ example: 500.0, description: 'Amount dropped to safe' })
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ApiProperty({
    example: 'Excess cash drop',
    description: 'Notes about drop',
    required: false,
  })
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'When cash was dropped' })
  @Column({ name: 'dropped_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  droppedAt: Date;

  @ApiProperty({ description: 'User who performed the drop' })
  @Column({ name: 'dropped_by' })
  droppedBy: number;

  // Relationships
  @ManyToOne(() => RegisterSession, (session) => session.cashDrops, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: RegisterSession;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'dropped_by' })
  user: User;
}
