import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
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
import { FireItemsDto } from '../dto/fire-items.dto';
import { UpdateKitchenStatusDto } from '../dto/update-kitchen-status.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { Order } from '../entities/order.entity';

@ApiTags('Orders')
@Controller()
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin)
  @ApiOperation({ summary: 'Create a new order (Internal)' })
  @ApiResponseWrapper(Order)
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.createOrder(createOrderDto, req.user);
  }

  @Post('public/orders')
  @ApiOperation({ summary: 'Public order intake' })
  @ApiResponseWrapper(Order)
  createPublic(@Body() createOrderDto: CreateOrderDto) {
    // No auth, so no user passed
    return this.ordersService.createOrder(createOrderDto);
  }

  @Patch('orders/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.DeliveryDriver)
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponseWrapper(Order)
  updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      +id,
      updateOrderStatusDto.status,
    );
  }

  @Get('orders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get all orders' })
  @ApiResponseWrapper(Order, true)
  findAll(@Query() query: any) {
    // Basic filtering implementation
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.customerId) where.customer = { id: +query.customerId };
    return this.ordersService.findAll({ where });
  }

  @Get('orders/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get order details' })
  @ApiResponseWrapper(Order)
  findOne(@Param('id') id: string) {
    return this.ordersService.getOrderById(+id);
  }

  // ==================== POS ENDPOINTS ====================

  @Patch('sales/orders/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Update order basic info' })
  @ApiResponseWrapper(Order)
  updateOrder(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.updateOrder(+id, updateDto, req.user.id);
  }

  @Delete('sales/orders/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin)
  @ApiOperation({ summary: 'Delete order (DRAFT only)' })
  @ApiResponseWrapper(Order)
  deleteOrder(@Param('id') id: string, @Req() req: any) {
    // TODO: Implement delete with DRAFT status validation
    return this.ordersService.delete(+id);
  }

  // ==================== ORDER ITEMS ====================

  @Post('sales/orders/:orderId/items')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Add item to order' })
  @ApiResponseWrapper(Order)
  addItem(
    @Param('orderId') orderId: string,
    @Body() itemDto: CreateOrderItemDto,
    @Req() req: any,
  ) {
    return this.ordersService.addItemToOrder(+orderId, itemDto, req.user.id);
  }

  @Patch('sales/orders/:orderId/items/:itemId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Update order item quantity' })
  @ApiResponseWrapper(Order)
  updateItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body('quantity') quantity: number,
    @Req() req: any,
  ) {
    return this.ordersService.updateOrderItem(+orderId, +itemId, quantity, req.user.id);
  }

  @Delete('sales/orders/:orderId/items/:itemId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Remove order item' })
  @ApiResponseWrapper(Order)
  removeItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    return this.ordersService.removeOrderItem(+orderId, +itemId, req.user.id);
  }

  @Post('sales/orders/:orderId/items/:itemId/void')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Void order item (requires manager)' })
  @ApiResponseWrapper(Order)
  voidItem(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() voidDto: VoidItemDto,
    @Req() req: any,
  ) {
    return this.ordersService.voidOrderItem(+orderId, +itemId, voidDto, req.user.id);
  }

  // ==================== PAYMENTS ====================

  @Post('sales/orders/:orderId/payments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Add payment to order' })
  @ApiResponseWrapper(Order)
  addPayment(
    @Param('orderId') orderId: string,
    @Body() paymentDto: AddPaymentDto,
    @Req() req: any,
  ) {
    return this.ordersService.addPayment(+orderId, paymentDto, req.user.id);
  }

  @Delete('sales/orders/:orderId/payments/:paymentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Remove payment from order' })
  @ApiResponseWrapper(Order)
  removePayment(
    @Param('orderId') orderId: string,
    @Param('paymentId') paymentId: string,
    @Req() req: any,
  ) {
    return this.ordersService.removePayment(+orderId, +paymentId, req.user.id);
  }

  // ==================== DISCOUNTS ====================

  @Post('sales/orders/:orderId/discount')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Apply discount to order' })
  @ApiResponseWrapper(Order)
  applyDiscount(
    @Param('orderId') orderId: string,
    @Body() discountDto: ApplyDiscountDto,
    @Req() req: any,
  ) {
    return this.ordersService.applyDiscount(+orderId, discountDto, req.user.id);
  }

  @Delete('sales/orders/:orderId/discount')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Remove discount from order' })
  @ApiResponseWrapper(Order)
  removeDiscount(@Param('orderId') orderId: string, @Req() req: any) {
    return this.ordersService.removeDiscount(+orderId, req.user.id);
  }

  // ==================== ORDER STATUS ====================

  @Post('sales/orders/:orderId/complete')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Complete order (generate ZATCA invoice)' })
  @ApiResponseWrapper(Order)
  completeOrder(@Param('orderId') orderId: string, @Req() req: any) {
    return this.ordersService.completeOrder(+orderId, req.user.id);
  }

  @Post('sales/orders/:orderId/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Cancel order' })
  @ApiResponseWrapper(Order)
  cancelOrder(
    @Param('orderId') orderId: string,
    @Body() cancelDto: CancelOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.cancelOrder(+orderId, cancelDto, req.user.id);
  }

  @Post('sales/orders/:orderId/void')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Void order (requires manager)' })
  @ApiResponseWrapper(Order)
  voidOrder(
    @Param('orderId') orderId: string,
    @Body() voidDto: VoidOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.voidOrder(+orderId, voidDto, req.user.id);
  }

  // ==================== HOLD/RECALL ====================

  @Post('sales/orders/:orderId/hold')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Hold order for later' })
  @ApiResponseWrapper(Order)
  holdOrder(
    @Param('orderId') orderId: string,
    @Body() holdDto: HoldOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.holdOrder(+orderId, holdDto, req.user.id);
  }

  @Post('sales/orders/:orderId/recall')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Recall held order' })
  @ApiResponseWrapper(Order)
  recallOrder(@Param('orderId') orderId: string, @Req() req: any) {
    return this.ordersService.recallOrder(+orderId, req.user.id);
  }

  // ==================== REFUNDS ====================

  @Post('sales/orders/:orderId/refund')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Process refund (full or partial)' })
  @ApiResponseWrapper(Order)
  processRefund(
    @Param('orderId') orderId: string,
    @Body() refundDto: RefundOrderDto,
    @Req() req: any,
  ) {
    return this.ordersService.processRefund(+orderId, refundDto, req.user.id);
  }

  // ==================== KITCHEN OPERATIONS ====================

  @Post('sales/orders/:orderId/fire')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Fire items to kitchen' })
  @ApiResponseWrapper(Order)
  fireItems(
    @Param('orderId') orderId: string,
    @Body() fireDto: FireItemsDto,
    @Req() req: any,
  ) {
    return this.ordersService.fireItemsToKitchen(
      +orderId,
      fireDto.itemIds,
      req.user.id,
    );
  }

  @Patch('sales/orders/:orderId/items/:itemId/kitchen-status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Update kitchen status for item' })
  @ApiResponseWrapper(Order)
  updateKitchenStatus(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() statusDto: UpdateKitchenStatusDto,
    @Req() req: any,
  ) {
    return this.ordersService.updateKitchenStatus(
      +orderId,
      +itemId,
      statusDto,
      req.user.id,
    );
  }
}
