import {
    Controller,
    Get,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiResponse } from '~/common/api-response.dto';
import { NotificationResponse } from './dto/notification.response';
import { RequestWithUser } from '~/common/utils';

@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}

    @UseGuards(JwtGuard)
    @Get()
    async getAllNotificationByUser(
        @Request() request: RequestWithUser,
    ): Promise<ApiResponse<NotificationResponse[]>> {
        const data = await this.notificationService.getAllNotificationByUser(
            request.user,
        );

        return {
            message: 'Notification fetched successfully',
            data,
        };
    }

    @UseGuards(JwtGuard)
    @Post(':id/read')
    async markAsRead(
        @Request() request: RequestWithUser,
        @Param('id') notificationId: string,
    ): Promise<ApiResponse<null>> {
        await this.notificationService.markAsRead(
            request.user.sub,
            notificationId,
        );
        return {
            message: 'Notification marked as read successfully',
            data: null,
        };
    }

    @UseGuards(JwtGuard)
    @Get('unread-count')
    async getUnreadCount(@Request() request: RequestWithUser): Promise<
        ApiResponse<{
            unreadCount: number;
        }>
    > {
        const data = await this.notificationService.getUnreadCount(
            request.user,
        );

        return {
            message: 'Unread count fetched successfully',
            data,
        };
    }
}
