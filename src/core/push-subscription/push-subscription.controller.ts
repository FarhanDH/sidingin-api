import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { RequestWithUser } from '~/common/utils';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CreatePushSubscriptionRequest } from './dto/push-subscription.request';
import { PushSubscriptionService } from './push-subscription.service';

@Controller('push-subscriptions')
export class PushSubscriptionController {
    constructor(
        private readonly pushSubscriptionService: PushSubscriptionService,
    ) {}

    @Post()
    @UseGuards(JwtGuard)
    async create(
        @Request() req: RequestWithUser,
        @Body() subscriptionDto: CreatePushSubscriptionRequest,
    ) {
        return await this.pushSubscriptionService.create(
            req.user,
            subscriptionDto,
        );
    }
}
