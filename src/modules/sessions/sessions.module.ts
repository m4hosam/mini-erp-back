import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionsController } from './controllers/sessions.controller';
import { SessionsService } from './services/sessions.service';
import { RegisterSession } from './entities/register-session.entity';
import { CashDrop } from './entities/cash-drop.entity';
import { PettyCash } from './entities/petty-cash.entity';
import { RegisterSessionRepository } from './repositories/register-session.repository';
import { CashDropRepository } from './repositories/cash-drop.repository';
import { PettyCashRepository } from './repositories/petty-cash.repository';
import { Order } from '../orders/entities/order.entity';
import { OrderPayment } from '../orders/entities/order-payment.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegisterSession,
      CashDrop,
      PettyCash,
      Order,
      OrderPayment,
      User,
    ]),
  ],
  controllers: [SessionsController],
  providers: [
    SessionsService,
    RegisterSessionRepository,
    CashDropRepository,
    PettyCashRepository,
  ],
  exports: [SessionsService],
})
export class SessionsModule {}
