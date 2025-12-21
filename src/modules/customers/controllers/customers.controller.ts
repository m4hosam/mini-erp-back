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
} from '@nestjs/common';
import { CustomersService } from '../services/customers.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';
import { ApiResponseWrapper } from '../../../common/decorators/api-response.decorator';
import { Customer } from '../entities/customer.entity';
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
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponseWrapper(Customer, true)
  findAll(@Query() query: any) {
    return this.customersService.findAll();
  }

  @Get('lookup')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get all customers for lookup' })
  @ApiResponseWrapper(BaseLookupGenericDto, true)
  lookup() {
    return this.customersService.getLookupGeneric();
  }

  @Get(':id')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get customer by id' })
  @ApiResponseWrapper(Customer)
  findOne(@Param('id') id: string) {
    return this.customersService.findById(+id);
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
