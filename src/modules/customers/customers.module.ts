import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './services/customers.service';
import { CustomersController } from './controllers/customers.controller';
import { Customer } from './entities/customer.entity';
import { CustomerRepository } from './repositories/customer.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Customer])],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerRepository],
  exports: [CustomersService, CustomerRepository], // Exporting for OrdersModule usage
})
export class CustomersModule {}
