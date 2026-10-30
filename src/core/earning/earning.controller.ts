import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiResponse } from '~/common/api-response.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { RoleEnum } from '~/common/enums/role.enum';
import { RequestWithUser } from '~/common/utils';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EarningResponse } from './dto/earning.response';
import { EarningService } from './earning.service';

@Controller('earnings')
export class EarningController {
    constructor(private readonly earningService: EarningService) {}

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.TECHNICIAN)
    @Get('summary')
    async getSummaryByDate(
        @Request() request: RequestWithUser,
        @Query('date')
        date?: Date,
        @Query('period')
        period?: 'daily' | 'weekly' | 'monthly',
    ): Promise<ApiResponse<EarningResponse>> {
        const data = await this.earningService.getSummaryByDate(
            date,
            request.user.sub,
            period,
        );
        return {
            message: 'Earning summary fetched successfully',
            data,
        };
    }
}
