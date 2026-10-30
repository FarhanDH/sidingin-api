import { Controller, Get, UseGuards } from '@nestjs/common';
import { CronGuard } from '../auth/guards/cron.guard';
import { ScheduledTaskService } from './scheduled-task.service';

@Controller('scheduled-tasks')
export class ScheduledTaskController {
    constructor(private readonly scheduledTaskService: ScheduledTaskService) {}

    @UseGuards(CronGuard)
    @Get('reminders')
    async sendServiceReminders() {
        return await this.scheduledTaskService.sendServiceReminders();
    }
}
