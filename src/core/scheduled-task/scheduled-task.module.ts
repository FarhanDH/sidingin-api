import { Module } from '@nestjs/common';
import { ScheduledTaskService } from './scheduled-task.service';
import { ScheduledTaskController } from './scheduled-task.controller';
import { OrderModule } from '../order/order.module';
import { NotificationModule } from '../notification/notification.module';
import { PushSubscriptionModule } from '../push-subscription/push-subscription.module';

@Module({
    imports: [OrderModule, NotificationModule, PushSubscriptionModule],
    controllers: [ScheduledTaskController],
    providers: [ScheduledTaskService],
})
export class ScheduledTaskModule {}
