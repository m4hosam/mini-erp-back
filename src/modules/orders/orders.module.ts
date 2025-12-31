import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './services/orders.service';
import { ZatcaService } from './services/zatca.service';
import { OrdersController } from './controllers/orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { OrderItemModifier } from './entities/order-item-modifier.entity';
import { OrderRefund } from './entities/order-refund.entity';
import { OrderRepository } from './repositories/order.repository';
import { OrderPaymentRepository } from './repositories/order-payment.repository';
import { OrderItemModifierRepository } from './repositories/order-item-modifier.repository';
import { OrderRefundRepository } from './repositories/order-refund.repository';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User } from '../users/entities/user.entity';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderPayment,
      OrderItemModifier,
      OrderRefund,
      Product,
      Customer,
      User,
    ]),
    CustomersModule,
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    ZatcaService,
    OrderRepository,
    OrderPaymentRepository,
    OrderItemModifierRepository,
    OrderRefundRepository,
  ],
  exports: [OrdersService, OrderRepository],
})
export class OrdersModule {}
