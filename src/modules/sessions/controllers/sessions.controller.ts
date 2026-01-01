import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SessionsService } from '../services/sessions.service';
import { OpenSessionDto } from '../dto/open-session.dto';
import { CloseSessionDto } from '../dto/close-session.dto';
import { CashDropDto } from '../dto/cash-drop.dto';
import { PettyCashDto } from '../dto/petty-cash.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/roles.enum';

@ApiTags('Cash Register Sessions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('open')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Open a new register session' })
  async openSession(@Body() dto: OpenSessionDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.sessionsService.openSession(dto, userId);
  }

  @Post(':sessionId/close')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Close a register session' })
  async closeSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: CloseSessionDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.sessionsService.closeSession(+sessionId, dto, userId);
  }

  @Get('active/:deviceId')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get active session for a device' })
  async getActiveSession(@Param('deviceId') deviceId: string) {
    return this.sessionsService.getActiveSession(deviceId);
  }

  @Get(':sessionId')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get session by ID' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.sessionsService.getSessionById(+sessionId);
  }

  @Get(':sessionId/balance')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Get session balance calculation' })
  async getSessionBalance(@Param('sessionId') sessionId: string) {
    return this.sessionsService.getSessionBalance(+sessionId);
  }

  @Post(':sessionId/drop-to-safe')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Record cash drop to safe' })
  async dropToSafe(
    @Param('sessionId') sessionId: string,
    @Body() dto: CashDropDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.sessionsService.dropToSafe(+sessionId, dto, userId);
  }

  @Post(':sessionId/petty-cash')
  @Roles(RoleEnum.Owner, RoleEnum.Admin, RoleEnum.Manager)
  @ApiOperation({ summary: 'Record petty cash expense' })
  async recordPettyCash(
    @Param('sessionId') sessionId: string,
    @Body() dto: PettyCashDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.sessionsService.recordPettyCash(+sessionId, dto, userId);
  }
}
