import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Query,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
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
    return this.ordersService.findById(+id);
  }
}
