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
} from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { AwardLoyaltyPointsDto } from '../dto/award-loyalty-points.dto';
import { RedeemLoyaltyPointsDto } from '../dto/redeem-loyalty-points.dto';
import { AddStoreCreditDto } from '../dto/add-store-credit.dto';
import { UseStoreCreditDto } from '../dto/use-store-credit.dto';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { Customer } from '../entities/customer.entity';
import { LoyaltyTransaction } from '../entities/loyalty-transaction.entity';
import { StoreCreditTransaction } from '../entities/store-credit-transaction.entity';
import { Order } from '../../orders/entities/order.entity';
import { BaseLookupDto } from 'src/common/dto/base-lookup.dto';
import { BaseLookupGenericDto } from 'src/common/dto/base-lookup-generic.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(RoleEnum.Owner, RoleEnum.Admin)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponseWrapper(Customer)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Search and filter customers' })
  @ApiResponseWrapper(Customer, true)
  async findAll(@Query() queryDto: CustomerQueryDto) {
    return this.customersService.searchCustomers(queryDto);
  }

  @Get('lookup')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get all customers for lookup' })
  @ApiResponseWrapper(BaseLookupGenericDto, true)
  lookup() {
    return this.customersService.getLookupGeneric();
  }

  @Get('phone/:phone')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get customer by phone (POS quick lookup)' })
  @ApiResponseWrapper(Customer)
  async getByPhone(@Param('phone') phone: string) {
    return this.customersService.getCustomerByPhone(phone);
  }

  @Get(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiResponseWrapper(Customer)
  findOne(@Param('id') id: string) {
    return this.customersService.findById(+id);
  }

  @Get(':customerId/orders')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get customer order history' })
  @ApiResponseWrapper(Order, true)
  async getCustomerOrders(
    @Param('customerId') customerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.customersService.getCustomerOrders(+customerId, page, limit);
  }

  @Get(':customerId/loyalty')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get customer loyalty summary' })
  async getLoyaltySummary(@Param('customerId') customerId: string) {
    return this.customersService.getLoyaltySummary(+customerId);
  }

  @Post(':customerId/loyalty/award')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Manually award loyalty points to customer' })
  @ApiResponseWrapper(Customer)
  async awardLoyaltyPoints(
    @Param('customerId') customerId: string,
    @Body() dto: AwardLoyaltyPointsDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.customersService.awardLoyaltyPoints(
      +customerId,
      dto.points,
      dto.reason,
      undefined,
      userId,
    );
  }

  @Post(':customerId/loyalty/redeem')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Redeem loyalty points for store credit' })
  async redeemLoyaltyPoints(
    @Param('customerId') customerId: string,
    @Body() dto: RedeemLoyaltyPointsDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.customersService.redeemLoyaltyPoints(
      +customerId,
      dto.points,
      userId,
    );
  }

  @Post(':customerId/credit/add')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Manually add store credit to customer' })
  @ApiResponseWrapper(Customer)
  async addStoreCredit(
    @Param('customerId') customerId: string,
    @Body() dto: AddStoreCreditDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.customersService.addStoreCredit(
      +customerId,
      dto.amount,
      dto.reason,
      undefined,
      userId,
    );
  }

  @Get(':customerId/credit/history')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get customer store credit transaction history' })
  @ApiResponseWrapper(StoreCreditTransaction, true)
  async getCreditHistory(@Param('customerId') customerId: string) {
    return this.customersService.getCreditHistory(+customerId);
  }

  @Patch(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin)
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponseWrapper(Customer)
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    const dtoWithId = { ...updateCustomerDto, id: +id };
    return this.customersService.update(dtoWithId);
  }

  @Delete(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin)
  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponseWrapper(Customer)
  remove(@Param('id') id: string) {
    return this.customersService.delete(+id);
  }
}
