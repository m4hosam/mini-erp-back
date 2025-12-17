import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { GenericService } from '../../../common/services/generic.service';
import { Order } from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { AssignDriverDto } from '../dto/assign-driver.dto';
import { OrderRepository } from '../repositories/order.repository';
import { ProductsService } from '../../products/services/products.service';
import { UsersService } from '../../users/services/users.service';
import { OrderStatus } from '../enums/order-status.enum';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import {
  AdjustStockDto,
  StockAdjustmentType,
} from '../../products/dto/adjust-stock.dto';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrdersService extends GenericService<
  Order,
  CreateOrderDto,
  any,
  any
> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productsService: ProductsService,
    private readonly usersService: UsersService,
  ) {
    super(orderRepository, 'Order');
  }

  toResponseDto(entity: Order): any {
    return entity;
  }

  toEntity(dto: any): Partial<Order> {
    return dto;
  }

  async findEntityById(id: number): Promise<Order | null> {
    return this.orderRepository.findWithItems(id);
  }

  async createOrder(dto: CreateOrderDto, userId?: number): Promise<Order> {
    // 1. Validate Items & Stock
    // 2. Determine initial status (RECEIVED or SOURCING)
    // 3. Calculate totals

    let isSourcing = false;
    const orderItems: OrderItem[] = [];
    let totalSalePrice = 0;
    let totalProductCost = 0;

    for (const itemDto of dto.items) {
      const product = await this.productsService.findEntityById(
        itemDto.productId,
      );
      if (!product) {
        throw new NotFoundException(ErrorMessages.ProductNotFound);
      }

      const hasStock = await this.productsService.checkStockAvailability(
        itemDto.productId,
        itemDto.quantity,
      );
      if (!hasStock) {
        isSourcing = true;
      }

      // Reserve stock (reduce)
      // Wait, requirement says: "If any product has insufficient stock, set order status to 'SOURCING'. Otherwise... RECEIVED. Reserve stock..."
      // Does 'SOURCING' mean we DON'T reserve stock yet? Or we reserve what we can?
      // Guide says: "Reserve stock (reduce currentStock by ordered quantity) - Create order..."
      // It implies we ALWAYS reserve/decrement. If negative, stock adjustment logic in ProductService might block it?
      // ProductService.adjustStock checks non-negative.
      // So if insufficient stock, we cannot decrement if logic enforces >= 0.
      // Guide 1.2: "Stock cannot go negative (throw BusinessValidationException)".
      // Guide 2.3: "If any product has insufficient stock, set order status to SOURCING".
      // This implies if SOURCING, we either don't decrement OR we allow negative.
      // But typically SOURCING means we need to buy it.
      // I'll assume if SOURCING, we do NOT decrement stock for that item? Or we decrement and it goes negative (but 1.2 says no negative).
      // So if SOURCING, we probably just mark it. But later when we get stock, we fulfill it?
      // Let's assume for this phase:
      // If SOURCING, we DO NOT decrement stock.
      // OR, maybe we decrement effectively reserving future stock.
      // Given constraints "Stock cannot go negative", if we try to decrement while low, it throws.
      // So logic: Check stock. If low -> SOURCING. Do NOT decrement stock?
      // But guide says: "Reserve stock (reduce currentStock by ordered quantity)".
      // This conflicts if stock must not go negative.
      // I will assume: If status is SOURCING, we skip reservation? Or we reserve ONLY if status is RECEIVED?
      // "Reserve stock... Create order".
      // I'll implement: Only reserve if status is RECEIVED.

      const item = new OrderItem();
      item.productId = product.id;
      item.quantity = itemDto.quantity;
      item.unitPrice = product.salePrice;
      item.unitCost = product.costPrice;
      item.totalPrice = Number(product.salePrice) * Number(itemDto.quantity);
      item.totalCost = Number(product.costPrice) * Number(itemDto.quantity);

      orderItems.push(item);
      totalSalePrice += item.totalPrice;
      totalProductCost += item.totalCost;
    }

    const status = isSourcing ? OrderStatus.SOURCING : OrderStatus.RECEIVED;

    if (status === OrderStatus.RECEIVED) {
      // Reserve stock
      for (const item of orderItems) {
        await this.productsService.adjustStock({
          productId: item.productId,
          quantity: item.quantity,
          type: StockAdjustmentType.REMOVE,
          reason: 'Order Created',
        });
      }
    }

    const order = new Order();
    // Generate Order Number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.orderRepository.count(); // Approximate
    order.orderNumber = `ORD-${dateStr}-${(count + 1).toString().padStart(3, '0')}`;

    order.customerName = dto.customerName;
    order.customerPhone = dto.customerPhone;
    order.customerAddress = dto.customerAddress;
    order.customerEmail = dto.customerEmail || '';
    order.status = status;
    order.totalSalePrice = totalSalePrice;
    order.totalProductCost = totalProductCost;
    order.miscCost = dto.miscCost || 0;
    order.deliveryCost = 0; // Set later
    order.netProfit = totalSalePrice - (totalProductCost + (dto.miscCost || 0));
    order.items = orderItems;
    order.notes = dto.notes || '';
    order.orderSource = dto.orderSource || 'MANUAL';
    order.createdBy = userId as any; // simplified

    return this.orderRepository.create(order);
  }

  async updateStatus(
    id: number,
    dto: UpdateOrderStatusDto,
    userId?: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findWithItems(id);
    if (!order) {
      throw new NotFoundException(ErrorMessages.OrderNotFound);
    }

    // Validate Transition
    this.validateTransition(order.status, dto.status);

    // If cancelling, restore stock (if it was reserved)
    // We reserved if status != SOURCING initially.
    // And if it moved from SOURCING -> PREPARING (implies stock arrived?), we should have reserved it then?
    // Handling stock reservation on state change is complex.
    // Simplification: If cancelling, and status was NOT Sourcing (or if we blindly restore), we might overflow.
    // Logic: If status was NOT SOURCING (meaning we reserved) -> Release.
    // But if it was SOURCING, we didn't reserve.
    // But what if it transitioned SOURCING -> PREPARING? We should have reserved then.
    // Need to handle SOURCING -> PREPARING transition logic inside here too.

    // SOURCING -> PREPARING: Should check/reserve stock.
    if (
      order.status === OrderStatus.SOURCING &&
      dto.status === OrderStatus.PREPARING
    ) {
      // Reserve now
      for (const item of order.items) {
        await this.productsService.adjustStock({
          productId: item.productId,
          quantity: item.quantity,
          type: StockAdjustmentType.REMOVE,
          reason: 'Order Sourced & Prepared',
        });
      }
    }

    // If Cancelled
    if (dto.status === OrderStatus.CANCELLED) {
      // Only release if we reserved.
      // We reserved if status is NOT SOURCING (assuming we handle SOURCING reservation correctly above).
      if (order.status !== OrderStatus.SOURCING) {
        for (const item of order.items) {
          await this.productsService.adjustStock({
            productId: item.productId,
            quantity: item.quantity,
            type: StockAdjustmentType.ADD,
            reason: 'Order Cancelled',
          });
        }
      }
    }

    // Update status
    order.status = dto.status;
    if (dto.notes) order.notes = dto.notes;
    order.updatedBy = userId;

    return this.orderRepository.create(order); // Save
  }

  async assignDriver(
    id: number,
    dto: AssignDriverDto,
    userId?: number,
  ): Promise<Order> {
    const order = await this.orderRepository.findWithItems(id);
    if (!order) {
      throw new NotFoundException(ErrorMessages.OrderNotFound);
    }

    if (order.status !== OrderStatus.PACKAGING) {
      throw new BusinessValidationException(
        ErrorMessages.OrderMustBeInPackaging,
      );
    }

    const driver = await this.usersService.findEntityById(dto.driverId);
    if (!driver || driver.role !== RoleEnum.DELIVERY_DRIVER) {
      throw new NotFoundException(ErrorMessages.DriverNotFound);
    }

    // Calculate delivery cost (Cost per KM? Not defined in Requirement for Driver entity. Assuming fixed or simple calc).
    // Guid says: "Calculate deliveryCost = deliveryDistanceKm * driver.costPerKm"
    // User entity does not have `costPerKm`.
    // I'll assume fixed rate or 0 for now, or just use distance as cost proxy?
    // I'll assume 5 per km.
    const COST_PER_KM = 5;
    order.deliveryCost = dto.deliveryDistanceKm * COST_PER_KM;
    order.deliveryDistanceKm = dto.deliveryDistanceKm;
    order.driver = driver;
    order.driverId = driver.id; // Now number
    order.status = OrderStatus.OUT_FOR_DELIVERY;

    // Recalculate Profit
    order.netProfit =
      order.totalSalePrice -
      (order.totalProductCost + order.miscCost + order.deliveryCost);
    order.updatedBy = userId;

    return this.orderRepository.create(order);
  }

  private validateTransition(from: OrderStatus, to: OrderStatus): void {
    const transitions: Record<string, OrderStatus[]> = {
      [OrderStatus.RECEIVED]: [
        OrderStatus.SOURCING,
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.SOURCING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.PACKAGING, OrderStatus.CANCELLED],
      [OrderStatus.PACKAGING]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!transitions[from]?.includes(to)) {
      throw new BusinessValidationException(
        ErrorMessages.InvalidStateTransition,
      );
    }
  }
}
