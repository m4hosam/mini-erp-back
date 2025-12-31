import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { GenericService } from '../../../common/services/generic.service';
import { Order } from '../entities/order.entity';
import { OrderRepository } from '../repositories/order.repository';
import { OrderPaymentRepository } from '../repositories/order-payment.repository';
import { OrderRefundRepository } from '../repositories/order-refund.repository';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { CreateOrderItemDto } from '../dto/create-order-item.dto';
import { AddPaymentDto } from '../dto/add-payment.dto';
import { ApplyDiscountDto } from '../dto/apply-discount.dto';
import { VoidItemDto } from '../dto/void-item.dto';
import { CancelOrderDto } from '../dto/cancel-order.dto';
import { VoidOrderDto } from '../dto/void-order.dto';
import { RefundOrderDto } from '../dto/refund-order.dto';
import { HoldOrderDto } from '../dto/hold-order.dto';
import { UpdateKitchenStatusDto } from '../dto/update-kitchen-status.dto';
import { Product } from '../../products/entities/product.entity';
import { OrderItem } from '../entities/order-item.entity';
import { OrderPayment } from '../entities/order-payment.entity';
import { OrderItemModifier } from '../entities/order-item-modifier.entity';
import { OrderRefund } from '../entities/order-refund.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';
import { KitchenStatus } from '../enums/kitchen-status.enum';
import { User } from '../../users/entities/user.entity';
import { ZatcaService } from './zatca.service';
import { BusinessValidationException } from '../../../common/exceptions/business-validation.exception';
import { NotFoundException } from '../../../common/exceptions/not-found.exception';
import { ErrorMessages } from '../../../common/constants/error-messages.constants';

@Injectable()
export class OrdersService extends GenericService<
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  Order
> {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly paymentRepository: OrderPaymentRepository,
    private readonly refundRepository: OrderRefundRepository,
    private readonly zatcaService: ZatcaService,
    private readonly dataSource: DataSource,
  ) {
    super(orderRepository, 'Order');
  }

  toResponseDto(entity: Order): Order {
    return entity;
  }

  toEntity(dto: CreateOrderDto | UpdateOrderDto): Partial<Order> {
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
      ],
      [OrderStatus.PACKAGING]: [
        OrderStatus.READY_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.READY_FOR_DELIVERY]: [
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
      ],
      // POS workflow transitions
      [OrderStatus.DRAFT]: [
        OrderStatus.PLACED,
        OrderStatus.CANCELLED,
        OrderStatus.HELD,
      ],
      [OrderStatus.PLACED]: [
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
        OrderStatus.HELD,
      ],
      [OrderStatus.HELD]: [OrderStatus.PLACED, OrderStatus.CANCELLED],
    };

    const validNext = allowed[current] || [];
    if (!validNext.includes(next)) {
      throw new BusinessValidationException(
        ErrorMessages.InvalidStateTransition,
      );
    }
  }

  // ==================== POS-SPECIFIC METHODS ====================

  /**
   * Get order by ID with all relations
   */
  async getOrderById(orderId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'customer',
        'items',
        'items.product',
        'items.modifiers',
        'payments',
        'refunds',
      ],
    });

    if (!order) {
      throw new NotFoundException(ErrorMessages.OrderNotFound);
    }

    return order;
  }

  /**
   * Update order basic info (orderType, tableId, notes)
   */
  async updateOrder(
    orderId: number,
    updateDto: UpdateOrderDto,
    userId: number,
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    // Only allow updates on DRAFT or PLACED orders
    if (![OrderStatus.DRAFT, OrderStatus.PLACED].includes(order.status)) {
      throw new BusinessValidationException(ErrorMessages.InvalidOrderStatus);
    }

    if (updateDto.orderType) order.orderType = updateDto.orderType;
    if (updateDto.tableId !== undefined) order.tableId = updateDto.tableId;
    if (updateDto.notes !== undefined) order.notes = updateDto.notes || null;

    order.updatedBy = userId;
    await this.dataSource.manager.save(Order, order);

    return this.getOrderById(orderId);
  }

  /**
   * Add item to order
   */
  async addItemToOrder(
    orderId: number,
    itemDto: CreateOrderItemDto,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException(ErrorMessages.OrderNotFound);
      }

      // Check if items are already fired to kitchen
      const hasFiredItems = order.items.some(
        (item) => item.kitchenStatus !== KitchenStatus.PENDING,
      );
      if (hasFiredItems) {
        throw new BusinessValidationException(ErrorMessages.ItemAlreadyFired);
      }

      // Get product
      const product = await manager.findOne(Product, {
        where: { id: itemDto.productId },
      });

      if (!product || !product.isActive) {
        throw new BusinessValidationException(
          ErrorMessages.ProductUsageNotAllowed,
        );
      }

      // Create order item
      const orderItem = new OrderItem();
      orderItem.order = order;
      orderItem.product = product;
      orderItem.productId = product.id;
      orderItem.productName = product.nameEn;
      orderItem.productNameAr = product.nameAr;
      orderItem.quantity = itemDto.quantity;
      orderItem.unitPrice = product.salePrice;
      orderItem.unitCost = product.costPrice;
      orderItem.notes = itemDto.notes || null;
      orderItem.kitchenStatus = KitchenStatus.PENDING;
      orderItem.createdBy = userId;

      // Calculate line total with modifiers
      let lineTotal = product.salePrice * itemDto.quantity;

      // Save item first to get ID
      const savedItem = await manager.save(OrderItem, orderItem);

      // Process modifiers if any
      if (itemDto.modifiers && itemDto.modifiers.length > 0) {
        const modifiers: OrderItemModifier[] = [];

        for (const modDto of itemDto.modifiers) {
          // TODO: Fetch actual modifier from products module when implemented
          const modifier = new OrderItemModifier();
          modifier.orderItem = savedItem;
          modifier.orderItemId = savedItem.id;
          modifier.modifierId = modDto.modifierId;
          modifier.modifierName = `Modifier ${modDto.modifierId}`; // Placeholder
          modifier.price = 0; // Placeholder - will be actual price from modifier
          modifier.quantity = modDto.quantity;
          modifier.createdBy = userId;

          lineTotal += modifier.price * modifier.quantity;
          modifiers.push(modifier);
        }

        await manager.save(OrderItemModifier, modifiers);
      }

      // Update line totals
      orderItem.subTotal = lineTotal;
      orderItem.lineTotal = lineTotal;
      await manager.save(OrderItem, orderItem);

      // Recalculate order totals
      await this.recalculateOrderTotals(order.id, manager);

      return this.getOrderById(orderId);
    });
  }

  /**
   * Update order item quantity
   */
  async updateOrderItem(
    orderId: number,
    itemId: number,
    quantity: number,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
      });

      if (!item) {
        throw new NotFoundException(ErrorMessages.OrderItemNotFound);
      }

      if (item.kitchenStatus !== KitchenStatus.PENDING) {
        throw new BusinessValidationException(ErrorMessages.ItemAlreadyFired);
      }

      item.quantity = quantity;
      item.subTotal = item.unitPrice * quantity;
      item.lineTotal = item.subTotal;
      item.updatedBy = userId;

      await manager.save(OrderItem, item);

      // Recalculate order totals
      await this.recalculateOrderTotals(orderId, manager);

      return this.getOrderById(orderId);
    });
  }

  /**
   * Remove order item
   */
  async removeOrderItem(
    orderId: number,
    itemId: number,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
      });

      if (!item) {
        throw new NotFoundException(ErrorMessages.OrderItemNotFound);
      }

      if (item.kitchenStatus !== KitchenStatus.PENDING) {
        throw new BusinessValidationException(ErrorMessages.ItemAlreadyFired);
      }

      await manager.remove(OrderItem, item);

      // Recalculate order totals
      await this.recalculateOrderTotals(orderId, manager);

      return this.getOrderById(orderId);
    });
  }

  /**
   * Void order item (requires manager authorization)
   */
  async voidOrderItem(
    orderId: number,
    itemId: number,
    voidDto: VoidItemDto,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
      });

      if (!item) {
        throw new NotFoundException(ErrorMessages.OrderItemNotFound);
      }

      item.isVoided = true;
      item.voidReason = voidDto.reason;
      item.voidAuthorizedBy = voidDto.authorizedBy;
      item.voidedAt = new Date();
      item.updatedBy = userId;

      await manager.save(OrderItem, item);

      // Recalculate order totals (voided items don't count)
      await this.recalculateOrderTotals(orderId, manager);

      return this.getOrderById(orderId);
    });
  }

  /**
   * Add payment to order
   */
  async addPayment(
    orderId: number,
    paymentDto: AddPaymentDto,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['payments'],
      });

      if (!order) {
        throw new NotFoundException(ErrorMessages.OrderNotFound);
      }

      // Validate payment doesn't exceed total
      const totalPaid =
        order.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const newTotal = totalPaid + paymentDto.amount;

      if (newTotal > order.total) {
        throw new BusinessValidationException(ErrorMessages.PaymentExceedsTotal);
      }

      // Handle special payment methods
      if (paymentDto.method === PaymentMethod.STORE_CREDIT) {
        // TODO: Integrate with CustomersService.useStoreCredit()
        // For now, just record the payment
      } else if (paymentDto.method === PaymentMethod.LOYALTY_POINTS) {
        // TODO: Integrate with CustomersService.redeemLoyaltyPoints()
        // For now, just record the payment
      }

      // Create payment record
      const payment = new OrderPayment();
      payment.order = order;
      payment.orderId = orderId;
      payment.method = paymentDto.method;
      payment.amount = paymentDto.amount;
      payment.reference = paymentDto.reference || null;
      payment.processedAt = new Date();
      payment.createdBy = userId;

      await manager.save(OrderPayment, payment);

      // Update order payment status
      await this.updatePaymentStatus(orderId, manager);

      return this.getOrderById(orderId);
    });
  }

  /**
   * Remove payment from order
   */
  async removePayment(
    orderId: number,
    paymentId: number,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
      });

      if (!order) {
        throw new NotFoundException(ErrorMessages.OrderNotFound);
      }

      if (order.status === OrderStatus.COMPLETED) {
        throw new BusinessValidationException(
          ErrorMessages.CannotRemovePaymentFromCompletedOrder,
        );
      }

      const payment = await manager.findOne(OrderPayment, {
        where: { id: paymentId, orderId },
      });

      if (!payment) {
        throw new NotFoundException(ErrorMessages.PaymentNotFound);
      }

      await manager.remove(OrderPayment, payment);

      // Update order payment status
      await this.updatePaymentStatus(orderId, manager);

      return this.getOrderById(orderId);
    });
  }

  /**
   * Apply discount to order
   */
  async applyDiscount(
    orderId: number,
    discountDto: ApplyDiscountDto,
    userId: number,
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    order.discount = {
      type: discountDto.type,
      value: discountDto.value,
      reason: discountDto.reason,
      authorizedBy: discountDto.authorizedBy,
    };
    order.updatedBy = userId;

    await this.dataSource.manager.save(Order, order);

    // Recalculate totals
    await this.recalculateOrderTotals(orderId);

    return this.getOrderById(orderId);
  }

  /**
   * Remove discount from order
   */
  async removeDiscount(orderId: number, userId: number): Promise<Order> {
    const order = await this.getOrderById(orderId);

    order.discount = undefined as any;
    order.updatedBy = userId;

    await this.dataSource.manager.save(Order, order);

    // Recalculate totals
    await this.recalculateOrderTotals(orderId);

    return this.getOrderById(orderId);
  }

  /**
   * Complete order (finalize and generate ZATCA invoice)
   */
  async completeOrder(orderId: number, userId: number): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.getOrderById(orderId);

      // Validate payment is complete
      if (order.amountDue > 0) {
        throw new BusinessValidationException(ErrorMessages.PaymentIncomplete);
      }

      // Generate ZATCA invoice
      const invoiceHash = this.zatcaService.generateInvoiceHash(order);
      const qrCode = this.zatcaService.generateQrCode(order);

      // Get previous hash for chaining
      const previousHash = await this.zatcaService.getLastInvoiceHash();

      order.status = OrderStatus.COMPLETED;
      order.completedAt = new Date();
      order.invoiceHash = invoiceHash;
      order.zatcaQrCode = qrCode;
      if (previousHash) {
        order.previousHash = previousHash;
      }
      order.updatedBy = userId;

      await manager.save(Order, order);

      // TODO: Trigger customer loyalty points award
      // await customersService.onOrderCompleted(order);

      return order;
    });
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    orderId: number,
    cancelDto: CancelOrderDto,
    userId: number,
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BusinessValidationException(ErrorMessages.InvalidOrderStatus);
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = cancelDto.reason;
    order.updatedBy = userId;

    await this.dataSource.manager.save(Order, order);

    return order;
  }

  /**
   * Void order (requires manager authorization)
   */
  async voidOrder(
    orderId: number,
    voidDto: VoidOrderDto,
    userId: number,
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BusinessValidationException(ErrorMessages.InvalidOrderStatus);
    }

    order.status = OrderStatus.VOIDED;
    order.voidedAt = new Date();
    order.voidReason = voidDto.reason;
    order.voidAuthorizedBy = voidDto.authorizedBy;
    order.updatedBy = userId;

    await this.dataSource.manager.save(Order, order);

    return order;
  }

  /**
   * Hold order for later
   */
  async holdOrder(
    orderId: number,
    holdDto: HoldOrderDto,
    userId: number,
  ): Promise<Order> {
    const order = await this.getOrderById(orderId);

    order.status = OrderStatus.HELD;
    order.heldAt = new Date();
    order.holdNote = holdDto.note || null;
    order.updatedBy = userId;

    await this.dataSource.manager.save(Order, order);

    return order;
  }

  /**
   * Recall held order
   */
  async recallOrder(orderId: number, userId: number): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (order.status !== OrderStatus.HELD) {
      throw new BusinessValidationException(ErrorMessages.InvalidOrderStatus);
    }

    order.status = OrderStatus.PLACED;
    order.recalledAt = new Date();
    order.updatedBy = userId;

    await this.dataSource.manager.save(Order, order);

    return order;
  }

  /**
   * Process refund (full or partial)
   */
  async processRefund(
    orderId: number,
    refundDto: RefundOrderDto,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await this.getOrderById(orderId);

      // Validate refund doesn't exceed total
      const totalRefunded =
        order.refunds?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      if (totalRefunded + refundDto.amount > order.total) {
        throw new BusinessValidationException(ErrorMessages.RefundExceedsTotal);
      }

      // Create refund record
      const refund = new OrderRefund();
      refund.order = order;
      refund.orderId = orderId;
      refund.amount = refundDto.amount;
      refund.reason = refundDto.reason;
      refund.authorizedBy = refundDto.authorizedBy;
      refund.processedAt = new Date();
      refund.createdBy = userId;

      await manager.save(OrderRefund, refund);

      // TODO: Add store credit to customer
      // await customersService.addStoreCredit(order.customerId, refundDto.amount, ...)

      return this.getOrderById(orderId);
    });
  }

  /**
   * Fire items to kitchen
   */
  async fireItemsToKitchen(
    orderId: number,
    itemIds: number[] | undefined,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException(ErrorMessages.OrderNotFound);
      }

      const itemsToFire = itemIds
        ? order.items.filter((item) => itemIds.includes(item.id))
        : order.items;

      for (const item of itemsToFire) {
        if (item.kitchenStatus === KitchenStatus.PENDING && !item.isVoided) {
          item.kitchenStatus = KitchenStatus.FIRED;
          item.firedAt = new Date();
          item.updatedBy = userId;
          await manager.save(OrderItem, item);
        }
      }

      return this.getOrderById(orderId);
    });
  }

  /**
   * Update kitchen status for an item
   */
  async updateKitchenStatus(
    orderId: number,
    itemId: number,
    statusDto: UpdateKitchenStatusDto,
    userId: number,
  ): Promise<Order> {
    return this.dataSource.transaction(async (manager) => {
      const item = await manager.findOne(OrderItem, {
        where: { id: itemId, orderId },
      });

      if (!item) {
        throw new NotFoundException(ErrorMessages.OrderItemNotFound);
      }

      item.kitchenStatus = statusDto.status;
      item.updatedBy = userId;

      await manager.save(OrderItem, item);

      return this.getOrderById(orderId);
    });
  }

  // ==================== HELPER METHODS ====================

  /**
   * Recalculate order totals (subtotal, discount, tax, total)
   */
  private async recalculateOrderTotals(
    orderId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager || this.dataSource.manager;

    const order = await em.findOne(Order, {
      where: { id: orderId },
      relations: ['items', 'items.modifiers', 'payments'],
    });

    if (!order) return;

    // Calculate subtotal (sum of non-voided items)
    const subtotal = order.items
      .filter((item) => !item.isVoided)
      .reduce((sum, item) => sum + Number(item.lineTotal), 0);

    // Calculate discount
    let discountTotal = 0;
    if (order.discount) {
      if (order.discount.type === 'PERCENT') {
        const percentage = parseFloat(order.discount.value);
        discountTotal = (subtotal * percentage) / 100;
      } else {
        discountTotal = parseFloat(order.discount.value);
      }
    }

    const afterDiscount = subtotal - discountTotal;

    // Calculate tax (15% VAT for Saudi Arabia)
    const taxRate = 0.15;
    const taxTotal = afterDiscount * taxRate;

    // Calculate final total
    const total = afterDiscount + taxTotal;

    // Calculate amount paid
    const amountPaid = order.payments
      ? order.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;

    const amountDue = Math.max(0, total - amountPaid);

    // Update order
    order.subtotal = subtotal;
    order.discountTotal = discountTotal;
    order.taxTotal = taxTotal;
    order.total = total;
    order.amountPaid = amountPaid;
    order.amountDue = amountDue;

    // Legacy fields for backward compatibility
    order.totalSalePrice = total;
    order.totalProductCost = order.items
      .filter((item) => !item.isVoided)
      .reduce((sum, item) => sum + Number(item.unitCost) * Number(item.quantity), 0);
    order.netProfit = total - order.totalProductCost;

    await em.save(Order, order);
  }

  /**
   * Update payment status based on amounts
   */
  private async updatePaymentStatus(
    orderId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager || this.dataSource.manager;

    const order = await em.findOne(Order, {
      where: { id: orderId },
      relations: ['payments'],
    });

    if (!order) return;

    const amountPaid = order.payments
      ? order.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      : 0;

    order.amountPaid = amountPaid;
    order.amountDue = Math.max(0, order.total - amountPaid);

    if (amountPaid === 0) {
      order.paymentStatus = PaymentStatus.UNPAID;
    } else if (amountPaid < order.total) {
      order.paymentStatus = PaymentStatus.PARTIAL;
    } else {
      order.paymentStatus = PaymentStatus.PAID;
    }

    await em.save(Order, order);
  }
}
