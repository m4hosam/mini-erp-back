import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { GenericService } from '../../../common/services/generic.service';
import { Customer } from '../entities/customer.entity';
import { CustomerRepository } from '../repositories/customer.repository';
import { LoyaltyTransactionRepository } from '../repositories/loyalty-transaction.repository';
import { StoreCreditTransactionRepository } from '../repositories/store-credit-transaction.repository';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { AwardLoyaltyPointsDto } from '../dto/award-loyalty-points.dto';
import { RedeemLoyaltyPointsDto } from '../dto/redeem-loyalty-points.dto';
import { AddStoreCreditDto } from '../dto/add-store-credit.dto';
import { UseStoreCreditDto } from '../dto/use-store-credit.dto';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';
import { LoyaltyTier, LoyaltyTierThresholds } from '../enums/loyalty-tier.enum';
import { LoyaltyTransactionType } from '../enums/loyalty-transaction-type.enum';
import { CreditTransactionType } from '../enums/credit-transaction-type.enum';
import { LoyaltyTransaction } from '../entities/loyalty-transaction.entity';
import { StoreCreditTransaction } from '../entities/store-credit-transaction.entity';
import { Order } from '../../orders/entities/order.entity';

@Injectable()
export class CustomersService extends GenericService<
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  Customer
> {
  constructor(
    private readonly customerRepository: CustomerRepository,
    private readonly loyaltyTransactionRepository: LoyaltyTransactionRepository,
    private readonly storeCreditTransactionRepository: StoreCreditTransactionRepository,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {
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

  // ============================================
  // Customer Lookup & Search
  // ============================================

  /**
   * Get customer by phone number (fast POS lookup)
   */
  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    return this.customerRepository.findByPhone(phone);
  }

  /**
   * Search customers by name or phone with pagination
   */
  async searchCustomers(
    queryDto: CustomerQueryDto,
  ): Promise<{ data: Customer[]; total: number }> {
    const { search, loyaltyTier, hasStoreCredit, page = 1, limit = 10 } = queryDto;

    const query = this.dataSource
      .getRepository(Customer)
      .createQueryBuilder('customer')
      .where('customer.is_active = :isActive', { isActive: true });

    // Search by name or phone
    if (search) {
      query.andWhere(
        '(customer.name ILIKE :search OR customer.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Filter by loyalty tier
    if (loyaltyTier) {
      query.andWhere('customer.loyalty_tier = :loyaltyTier', { loyaltyTier });
    }

    // Filter customers with store credit
    if (hasStoreCredit) {
      query.andWhere('customer.store_credit > 0');
    }

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Order by last visit
    query.orderBy('customer.last_visit_at', 'DESC', 'NULLS LAST');

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }

  // ============================================
  // Order History
  // ============================================

  /**
   * Get customer's order history with pagination
   */
  async getCustomerOrders(
    customerId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Order[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.orderRepository.findAndCount({
      where: { customerId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  // ============================================
  // Loyalty Program
  // ============================================

  /**
   * Get loyalty summary for a customer
   */
  async getLoyaltySummary(customerId: number): Promise<{
    customer: Customer;
    recentTransactions: LoyaltyTransaction[];
  }> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
    }

    const recentTransactions =
      await this.loyaltyTransactionRepository.findByCustomerId(customerId, 10);

    return { customer, recentTransactions };
  }

  /**
   * Award loyalty points to customer
   * @param orderId - Optional order ID if points are from a purchase
   */
  async awardLoyaltyPoints(
    customerId: number,
    points: number,
    reason: string,
    orderId?: number,
    userId?: number,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
    }

    return this.dataSource.transaction(async (manager) => {
      // Update customer points
      customer.loyaltyPoints += points;
      customer.lifetimePoints += points;

      // Update tier based on lifetime points
      const newTier = this.calculateTier(customer.lifetimePoints);
      customer.loyaltyTier = newTier;

      await manager.save(Customer, customer);

      // Record transaction
      const transaction = manager.create(LoyaltyTransaction, {
        customerId,
        type: LoyaltyTransactionType.EARN,
        points,
        reason,
        orderId: orderId || null,
        balanceAfter: customer.loyaltyPoints,
        createdBy: userId,
      });

      await manager.save(LoyaltyTransaction, transaction);

      return customer;
    });
  }

  /**
   * Redeem loyalty points
   * Rate: 10 points = 1 SAR
   */
  async redeemLoyaltyPoints(
    customerId: number,
    points: number,
    userId?: number,
  ): Promise<{ customer: Customer; creditAmount: number }> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
    }

    // Validate points are multiple of 10
    if (points % 10 !== 0) {
      throw new BusinessValidationException(
        ErrorMessages.InvalidRedemptionAmount,
      );
    }

    // Validate sufficient points
    if (customer.loyaltyPoints < points) {
      throw new BusinessValidationException(
        ErrorMessages.InsufficientLoyaltyPoints,
      );
    }

    // Calculate credit amount (10 points = 1 SAR)
    const creditAmount = points / 10;

    return this.dataSource.transaction(async (manager) => {
      // Deduct points
      customer.loyaltyPoints -= points;
      await manager.save(Customer, customer);

      // Record loyalty transaction
      const loyaltyTransaction = manager.create(LoyaltyTransaction, {
        customerId,
        type: LoyaltyTransactionType.REDEEM,
        points: -points, // Negative for redemption
        reason: `Redeemed ${points} points for ${creditAmount} SAR credit`,
        orderId: null,
        balanceAfter: customer.loyaltyPoints,
        createdBy: userId,
      });

      await manager.save(LoyaltyTransaction, loyaltyTransaction);

      // Add store credit
      const balanceBefore = customer.storeCredit;
      customer.storeCredit = Number(customer.storeCredit) + creditAmount;
      await manager.save(Customer, customer);

      // Record credit transaction
      const creditTransaction = manager.create(StoreCreditTransaction, {
        customerId,
        type: CreditTransactionType.ADD,
        amount: creditAmount,
        reason: `Redeemed from ${points} loyalty points`,
        orderId: null,
        balanceBefore,
        balanceAfter: customer.storeCredit,
        createdBy: userId,
      });

      await manager.save(StoreCreditTransaction, creditTransaction);

      return { customer, creditAmount };
    });
  }

  /**
   * Calculate loyalty tier based on lifetime points
   */
  calculateTier(lifetimePoints: number): LoyaltyTier {
    if (lifetimePoints >= LoyaltyTierThresholds.PLATINUM.min) {
      return LoyaltyTier.PLATINUM;
    } else if (lifetimePoints >= LoyaltyTierThresholds.GOLD.min) {
      return LoyaltyTier.GOLD;
    } else if (lifetimePoints >= LoyaltyTierThresholds.SILVER.min) {
      return LoyaltyTier.SILVER;
    } else {
      return LoyaltyTier.BRONZE;
    }
  }

  /**
   * Update customer tier based on current lifetime points
   */
  async updateCustomerTier(customerId: number): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
    }

    const newTier = this.calculateTier(customer.lifetimePoints);
    if (customer.loyaltyTier !== newTier) {
      customer.loyaltyTier = newTier;
      await this.dataSource.manager.save(Customer, customer);
    }

    return customer;
  }

  // ============================================
  // Store Credit
  // ============================================

  /**
   * Add store credit to customer account
   * @param orderId - Optional order ID if credit is from a refund
   */
  async addStoreCredit(
    customerId: number,
    amount: number,
    reason: string,
    orderId?: number,
    userId?: number,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
    }

    return this.dataSource.transaction(async (manager) => {
      const balanceBefore = Number(customer.storeCredit);
      customer.storeCredit = balanceBefore + amount;

      await manager.save(Customer, customer);

      // Record transaction
      const transaction = manager.create(StoreCreditTransaction, {
        customerId,
        type: orderId
          ? CreditTransactionType.REFUND
          : CreditTransactionType.ADD,
        amount,
        reason,
        orderId: orderId || null,
        balanceBefore,
        balanceAfter: customer.storeCredit,
        createdBy: userId,
      });

      await manager.save(StoreCreditTransaction, transaction);

      return customer;
    });
  }

  /**
   * Use store credit for payment
   */
  async useStoreCredit(
    customerId: number,
    amount: number,
    orderId: number,
    userId?: number,
  ): Promise<Customer> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
    }

    // Validate sufficient credit
    if (Number(customer.storeCredit) < amount) {
      throw new BusinessValidationException(
        ErrorMessages.InsufficientStoreCredit,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const balanceBefore = Number(customer.storeCredit);
      customer.storeCredit = balanceBefore - amount;

      await manager.save(Customer, customer);

      // Record transaction
      const transaction = manager.create(StoreCreditTransaction, {
        customerId,
        type: CreditTransactionType.USE,
        amount: -amount, // Negative for usage
        reason: `Used for order #${orderId}`,
        orderId,
        balanceBefore,
        balanceAfter: customer.storeCredit,
        createdBy: userId,
      });

      await manager.save(StoreCreditTransaction, transaction);

      return customer;
    });
  }

  /**
   * Get store credit transaction history
   */
  async getCreditHistory(
    customerId: number,
  ): Promise<StoreCreditTransaction[]> {
    return this.storeCreditTransactionRepository.findByCustomerId(customerId);
  }

  /**
   * Validate customer has sufficient store credit
   */
  async validateCreditBalance(
    customerId: number,
    amount: number,
  ): Promise<boolean> {
    const customer = await this.customerRepository.findById(customerId);
    if (!customer) {
      throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
    }

    return Number(customer.storeCredit) >= amount;
  }

  // ============================================
  // Auto-triggers (called by OrdersService)
  // ============================================

  /**
   * Auto-triggered when order is completed
   * Awards 1 point per 1 SAR spent
   */
  async onOrderCompleted(order: Order, userId?: number): Promise<void> {
    if (!order.customerId) {
      return; // Skip if no customer
    }

    const customer = await this.customerRepository.findById(order.customerId);
    if (!customer) {
      return;
    }

    // Award 1 point per 1 SAR
    const pointsToAward = Math.floor(Number(order.total));

    if (pointsToAward > 0) {
      await this.awardLoyaltyPoints(
        order.customerId,
        pointsToAward,
        `Order #${order.orderNumber} completed`,
        order.id,
        userId,
      );
    }

    // Update customer stats
    await this.dataSource.transaction(async (manager) => {
      customer.totalOrdersCount += 1;
      customer.totalSpent = Number(customer.totalSpent) + Number(order.total);
      customer.lastVisitAt = new Date();

      await manager.save(Customer, customer);
    });
  }

  /**
   * Auto-triggered when order is refunded
   * Adds refund amount as store credit
   */
  async onOrderRefunded(
    order: Order,
    refundAmount: number,
    userId?: number,
  ): Promise<void> {
    if (!order.customerId) {
      return; // Skip if no customer
    }

    await this.addStoreCredit(
      order.customerId,
      refundAmount,
      `Refund for order #${order.orderNumber}`,
      order.id,
      userId,
    );
  }
}
