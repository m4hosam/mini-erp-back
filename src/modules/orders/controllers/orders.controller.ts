import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { AssignDriverDto } from '../dto/assign-driver.dto';
import { BaseFilterDto } from '../../../common/dto/base-filter.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { OrderStatus } from '../enums/order-status.enum';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create new order' })
  // @ApiResponseWrapper(Order)
  async create(
    @Body() createDto: CreateOrderDto,
    @Req() req: any,
  ): Promise<any> {
    const userId = req.user?.id;
    return this.ordersService.createOrder(createDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List orders' })
  // @ApiResponseWrapper(Order, true)
  async findAll(
    @Query() filterDto: BaseFilterDto,
  ): Promise<PaginatedResult<any>> {
    const { page, limit, sortBy, sortOrder, ...filters } = filterDto;
    return this.ordersService.findWithPagination(
      { page, limit },
      {
        where: filters as any,
        order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
        relations: ['items', 'driver'], // Include items in list?
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.ordersService.findEntityById(id); // Or custom method with relations
  }

  @Patch(':id/status')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @Req() req: any,
  ): Promise<any> {
    const userId = req.user?.id;
    return this.ordersService.updateStatus(id, dto, userId);
  }

  @Post(':id/assign-driver')
  @Roles(RoleEnum.OWNER, RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Assign driver' })
  async assignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignDriverDto,
    @Req() req: any,
  ): Promise<any> {
    const userId = req.user?.id;
    return this.ordersService.assignDriver(id, dto, userId);
  }
}
