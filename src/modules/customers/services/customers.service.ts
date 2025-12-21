import { Injectable } from '@nestjs/common';
import { GenericService } from '../../../common/services/generic.service';
import { Customer } from '../entities/customer.entity';
import { CustomerRepository } from '../repositories/customer.repository';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';

@Injectable()
export class CustomersService extends GenericService<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  Customer
> {
  constructor(private readonly customerRepository: CustomerRepository) {
    super(customerRepository, 'Customer');
  }

  toResponseDto(entity: Customer): Customer {
    return entity;
  }

  toEntity(dto: CreateCustomerDto | UpdateCustomerDto): Partial<Customer> {
    return dto;
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.customerRepository.findByPhone(
      createCustomerDto.phone,
    );
    if (existing) {
      throw new BusinessValidationException(ErrorMessages.PhoneAlreadyExists);
    }
    return super.create(createCustomerDto);
  }

  async updateStats(id: number): Promise<void> {
    // This method can be expanded if we need to recalculate from orders,
    // but for now leveraging increment from repository is efficient.
    await this.customerRepository.incrementOrdersCount(id);
  }
}
