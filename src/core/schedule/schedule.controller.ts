import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '~/common/utils';
import { ApiResponse } from '~/common/api-response.dto';

@Controller('schedules')
export class ScheduleController {
    constructor(private readonly scheduleService: ScheduleService) {}

    @UseGuards(JwtGuard)
    @Get('availability')
    async getScheduleAvailability(
        @Request() request: RequestWithUser,
        @Query('start-date') startDate: string,
        @Query('end-date') endDate: string,
    ): Promise<ApiResponse<{ date: string; totalUnitsBooked: number }[]>> {
        const data = await this.scheduleService.getScheduleAvailability(
            startDate,
            endDate,
        );

        return {
            message: 'Schedule availability fetched successfully',
            data,
        };
    }
}
