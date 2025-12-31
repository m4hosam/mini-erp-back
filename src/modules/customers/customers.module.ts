import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { Customer } from './entities/customer.entity';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { StoreCreditTransaction } from './entities/store-credit-transaction.entity';
import { CustomerRepository } from './repositories/customer.repository';
import { LoyaltyTransactionRepository } from './repositories/loyalty-transaction.repository';
import { StoreCreditTransactionRepository } from './repositories/store-credit-transaction.repository';
import { Order } from '../orders/entities/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Customer,
      LoyaltyTransaction,
      StoreCreditTransaction,
      Order, // Needed for CustomersService.getCustomerOrders()
    ]),
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    CustomerRepository,
    LoyaltyTransactionRepository,
    StoreCreditTransactionRepository,
  ],
  exports: [
    CustomersService,
    CustomerRepository,
    LoyaltyTransactionRepository,
    StoreCreditTransactionRepository,
  ], // Exporting for OrdersModule usage
})
export class CustomersModule {}
