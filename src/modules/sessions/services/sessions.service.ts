import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { RegisterSession } from '../entities/register-session.entity';
import { CashDrop } from '../entities/cash-drop.entity';
import { PettyCash } from '../entities/petty-cash.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderPayment } from '../../orders/entities/order-payment.entity';
import { RegisterSessionRepository } from '../repositories/register-session.repository';
import { CashDropRepository } from '../repositories/cash-drop.repository';
import { PettyCashRepository } from '../repositories/petty-cash.repository';
import { OpenSessionDto } from '../dto/open-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';
import { CashDropDto } from '../dto/cash-drop.dto';
import { PettyCashDto } from '../dto/petty-cash.dto';
import { PaymentMethod } from '../../orders/enums/payment-method.enum';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionRepository: RegisterSessionRepository,
    private readonly cashDropRepository: CashDropRepository,
    private readonly pettyCashRepository: PettyCashRepository,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderPayment)
    private readonly paymentRepository: Repository<OrderPayment>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Open a new register session
   */
  async openSession(
    dto: OpenSessionDto,
    userId: number,
  ): Promise<RegisterSession> {
    // Check if there's already an active session for this device
    const activeSession = await this.sessionRepository.findActiveByDevice(
      dto.deviceId,
    );

    if (activeSession) {
      throw new BusinessValidationException(ErrorMessages.SessionAlreadyOpen);
    }

    const session = this.dataSource.getRepository(RegisterSession).create({
      deviceId: dto.deviceId,
      userId,
      openingBalance: dto.openingBalance,
      isOpen: true,
      openedAt: new Date(),
      createdBy: userId,
    });

    return this.dataSource.manager.save(RegisterSession, session);
  }

  /**
   * Close a register session
   */
  async closeSession(
    sessionId: number,
    dto: CloseSessionDto,
    userId: number,
  ): Promise<RegisterSession> {
    const session = await this.sessionRepository.findWithRelations(sessionId);

    if (!session) {
      throw new NotFoundException(ErrorMessages.SessionNotFound);
    }

    if (!session.isOpen) {
      throw new BusinessValidationException(ErrorMessages.SessionAlreadyClosed);
    }

    // Calculate expected balance
    const expectedBalance = await this.calculateExpectedBalance(sessionId);

    // Calculate discrepancy
    const discrepancy = dto.closingBalance - expectedBalance;

    session.closingBalance = dto.closingBalance;
    session.expectedBalance = expectedBalance;
    session.discrepancy = discrepancy;
    session.isOpen = false;
    session.closedAt = new Date();
    session.closedBy = userId;
    session.notes = dto.notes || null;
    session.updatedBy = userId;

    return this.dataSource.manager.save(RegisterSession, session);
  }

  /**
   * Get active session for a device
   */
  async getActiveSession(deviceId: string): Promise<RegisterSession | null> {
    return this.sessionRepository.findActiveByDevice(deviceId);
  }

  /**
   * Get session by ID
   */
  async getSessionById(sessionId: number): Promise<RegisterSession> {
    const session = await this.sessionRepository.findWithRelations(sessionId);

    if (!session) {
      throw new NotFoundException(ErrorMessages.SessionNotFound);
    }

    return session;
  }

  /**
   * Get session balance calculation
   */
  async getSessionBalance(sessionId: number): Promise<{
    session: RegisterSession;
    openingBalance: number;
    cashSales: number;
    cashRefunds: number;
    cashDrops: number;
    pettyCash: number;
    expectedBalance: number;
    closingBalance: number | null;
    discrepancy: number | null;
  }> {
    const session = await this.getSessionById(sessionId);

    const cashSales = await this.calculateCashSales(sessionId);
    const cashRefunds = await this.calculateCashRefunds(sessionId);
    const cashDrops = await this.cashDropRepository.calculateTotalDrops(
      sessionId,
    );
    const pettyCash = await this.pettyCashRepository.calculateTotalPettyCash(
      sessionId,
    );

    const expectedBalance = await this.calculateExpectedBalance(sessionId);

    return {
      session,
      openingBalance: Number(session.openingBalance),
      cashSales,
      cashRefunds,
      cashDrops,
      pettyCash,
      expectedBalance,
      closingBalance: session.closingBalance
        ? Number(session.closingBalance)
        : null,
      discrepancy: session.discrepancy ? Number(session.discrepancy) : null,
    };
  }

  /**
   * Record cash drop to safe
   */
  async dropToSafe(
    sessionId: number,
    dto: CashDropDto,
    userId: number,
  ): Promise<CashDrop> {
    const session = await this.getSessionById(sessionId);

    if (!session.isOpen) {
      throw new BusinessValidationException(ErrorMessages.SessionAlreadyClosed);
    }

    const cashDrop = this.dataSource.getRepository(CashDrop).create({
      sessionId,
      amount: dto.amount,
      notes: dto.notes || null,
      droppedAt: new Date(),
      droppedBy: userId,
      createdBy: userId,
    });

    return this.dataSource.manager.save(CashDrop, cashDrop);
  }

  /**
   * Record petty cash expense
   */
  async recordPettyCash(
    sessionId: number,
    dto: PettyCashDto,
    userId: number,
  ): Promise<PettyCash> {
    const session = await this.getSessionById(sessionId);

    if (!session.isOpen) {
      throw new BusinessValidationException(ErrorMessages.SessionAlreadyClosed);
    }

    const pettyCash = this.dataSource.getRepository(PettyCash).create({
      sessionId,
      amount: dto.amount,
      reason: dto.reason,
      paidAt: new Date(),
      paidBy: userId,
      createdBy: userId,
    });

    return this.dataSource.manager.save(PettyCash, pettyCash);
  }

  /**
   * Calculate expected cash balance
   * Formula: Opening + Cash Sales - Cash Refunds - Cash Drops - Petty Cash
   */
  async calculateExpectedBalance(sessionId: number): Promise<number> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundException(ErrorMessages.SessionNotFound);
    }

    const openingBalance = Number(session.openingBalance);
    const cashSales = await this.calculateCashSales(sessionId);
    const cashRefunds = await this.calculateCashRefunds(sessionId);
    const cashDrops = await this.cashDropRepository.calculateTotalDrops(
      sessionId,
    );
    const pettyCash = await this.pettyCashRepository.calculateTotalPettyCash(
      sessionId,
    );

    return openingBalance + cashSales - cashRefunds - cashDrops - pettyCash;
  }

  /**
   * Calculate total cash sales for session
   */
  private async calculateCashSales(sessionId: number): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .innerJoin('payment.order', 'order')
      .select('SUM(payment.amount)', 'total')
      .where('order.register_session_id = :sessionId', { sessionId })
      .andWhere('payment.method = :method', { method: PaymentMethod.CASH })
      .getRawOne();

    return Number(result?.total) || 0;
  }

  /**
   * Calculate total cash refunds for session
   */
  private async calculateCashRefunds(sessionId: number): Promise<number> {
    // For now, return 0. This can be enhanced to track refunds by payment method
    // when refund payment method tracking is added
    return 0;
  }
}
