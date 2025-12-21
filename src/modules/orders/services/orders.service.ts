import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { GenericService } from '../../../common/services/generic.service';
import { Order } from '../entities/order.entity';
import { OrderRepository } from '../repositories/order.repository';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { Product } from '../../products/entities/product.entity';
import { OrderItem } from '../entities/order-item.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { User } from '../../users/entities/user.entity';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';

@Injectable()
export class OrdersService extends GenericService<
  Order,
  CreateOrderDto,
  UpdateOrderStatusDto,
  Order
> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly dataSource: DataSource,
  ) {
    super(orderRepository, 'Order');
  }

  toResponseDto(entity: Order): Order {
    return entity;
  }

  toEntity(dto: CreateOrderDto | UpdateOrderStatusDto): Partial<Order> {
    // This is tricky because CreateOrderDto structure is different from Order entity
    // But generic create/update might not be used directly if we override/use custom methods
    // returning empty partial or simple mapping for now
    return dto as unknown as Partial<Order>;
  }

  async createOrder(
    createOrderDto: CreateOrderDto,
    user?: User,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      const { customerId, items } = createOrderDto;

      // 1. Get Customer
      const customer = await manager.findOne(Customer, {
        where: { id: customerId },
      });
      if (!customer) {
        throw new BusinessValidationException(ErrorMessages.CustomerNotFound);
      }

      // 2. Process Items & Inventory
      const orderItems: OrderItem[] = [];
      let totalSalePrice = 0;
      let totalProductCost = 0;
      let isLowStock = false;

      for (const itemDto of items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
        });

        if (!product) {
          throw new BusinessValidationException(ErrorMessages.ProductNotFound);
        }
        if (!product.isActive) {
          throw new BusinessValidationException(
            ErrorMessages.ProductUsageNotAllowed,
          );
        }

        if (product.currentStock < itemDto.quantity) {
          throw new BusinessValidationException(
            ErrorMessages.InsufficientStock,
          );
        }

        // Deduct Stock
        product.currentStock =
          Number(product.currentStock) - Number(itemDto.quantity); // Ensure numbers
        if (product.currentStock <= product.reorderLevel) {
          isLowStock = true;
        }
        await manager.save(product);

        // Create Item Snapshot
        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;
        orderItem.unitPrice = product.salePrice;
        orderItem.unitCost = product.costPrice;
        orderItem.subTotal = product.salePrice * itemDto.quantity;

        totalSalePrice += Number(orderItem.subTotal);
        totalProductCost += Number(product.costPrice * itemDto.quantity);

        orderItems.push(orderItem);
      }

      // 3. Determine Status
      const status = isLowStock ? OrderStatus.SOURCING : OrderStatus.RECEIVED;

      // 4. Generate Order Number
      const date = new Date();
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      // Note: This count is not strictly safe in high concurrency without lock, but suffices for now
      const count = await this.orderRepository.countOrdersByDate(date);
      const sequence = (count + 1).toString().padStart(3, '0');
      const orderNumber = `ORD-${dateStr}-${sequence}`;

      // 5. Create Order
      const order = new Order();
      order.orderNumber = orderNumber;
      order.status = status;
      order.totalSalePrice = totalSalePrice;
      order.totalProductCost = totalProductCost;
      order.netProfit = totalSalePrice - totalProductCost;
      order.customer = customer;
      order.customer = customer;
      // Assign driver
      if (user) {
        order.driver = { id: user.id } as User;
      }

      // Save Order first (without items to ensure ID generation)
      const savedOrder = await manager.save(Order, order);

      // Assign saved order to items and save items
      orderItems.forEach((item) => (item.order = savedOrder));
      await manager.save(OrderItem, orderItems);

      savedOrder.items = orderItems;

      // 6. Update Customer Stats
      customer.totalOrdersCount += 1;
      await manager.save(Customer, customer);

      return savedOrder;
    });
  }

  async updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
    if (!order) {
      throw new BusinessValidationException(ErrorMessages.OrderNotFound);
    }

    this.validateStateTransition(order.status, status);

    // Handle Cancellation - Restore Stock
    if (
      status === OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      await this.dataSource.transaction(async (manager) => {
        for (const item of order.items) {
          const product = await manager.findOne(Product, {
            where: { id: item.product.id },
          });
          if (product) {
            product.currentStock =
              Number(product.currentStock) + Number(item.quantity);
            await manager.save(Product, product);
          }
        }
        order.status = status;
        await manager.save(Order, order);
      });
      return order;
    } else {
      // Normal transition - using update as GenericRepository might not expose save
      await this.orderRepository.update(id, { status } as any);
      order.status = status;
      return order;
    }
  }

  private validateStateTransition(
    current: OrderStatus,
    next: OrderStatus,
  ): void {
    if (current === next) return;

    const allowed: Record<string, OrderStatus[]> = {
      [OrderStatus.RECEIVED]: [
        OrderStatus.SOURCING,
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PREPARING]: [OrderStatus.PACKAGING, OrderStatus.CANCELLED],
      [OrderStatus.SOURCING]: [
        OrderStatus.RECEIVED,
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ], // Assumed escape paths
      [OrderStatus.PACKAGING]: [
        OrderStatus.READY_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ], // Assumed
      [OrderStatus.READY_FOR_DELIVERY]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ], // Assumed
    };

    const validNext = allowed[current] || [];
    if (!validNext.includes(next)) {
      throw new BusinessValidationException(
        ErrorMessages.InvalidStateTransition,
      );
    }
  }
}
