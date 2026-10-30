import { Injectable, Logger } from '@nestjs/common';
import { differenceInMonths } from 'date-fns';
import { NotificationType } from '~/common/enums/notification-type.enum';
import { NotificationService } from '../notification/notification.service';
import { OrderService } from '../order/order.service';
import { PushSubscriptionService } from '../push-subscription/push-subscription.service';

@Injectable()
export class ScheduledTaskService {
    private readonly logger = new Logger(ScheduledTaskService.name);

    constructor(
        private readonly orderService: OrderService,
        private readonly notificationService: NotificationService,
        private readonly pushSubscriptionService: PushSubscriptionService,
    ) {}

    /**
     * Runs a scheduled task to send service reminders to customers.
     * It checks all completed orders in the last 3 months and
     * sends a notification to customers who haven't received
     * a service reminder notification yet.
     */
    async sendServiceReminders() {
        this.logger.log('Running service reminder task...');

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Get all completed orders in the last 3 months
        const completedOrders =
            await this.orderService.getAllOrdersCompletedInThreeMonths();

        // Check if all completed orders have been notified
        const isCompletedOrdersNotified = completedOrders.every((order) => {
            return order.notifications.some(
                (notification) =>
                    notification.type === NotificationType.SERVICE_REMINDER,
            );
        });

        // If some orders haven't been notified, send a notification
        for (const order of isCompletedOrdersNotified ? [] : completedOrders) {
            const monthsAgo = differenceInMonths(new Date(), order.updated_at);
            if (monthsAgo < 3) continue; // Only send if it's been 3 or more months

            const notification = await this.notificationService.create({
                title: 'AC-mu Saatnya Diservis, Nih! 🛠️',
                message: `Udah sekitar ${monthsAgo} bulan sejak servis terakhir di ${order.property_type.toLocaleLowerCase()}-mu. Biar tetep adem, yuk, servis lagi!`,
                type: NotificationType.SERVICE_REMINDER,
                recipientId: order.customer.id,
                orderId: order.id,
            });

            // Send a push notification to the customer
            await this.pushSubscriptionService.sendNotificationToUser(
                notification.recipient.id,
                {
                    title: notification.title,
                    body: notification.message,
                    tag: notification.type,
                },
            );
        }

        this.logger.log(
            `Sent ${isCompletedOrdersNotified ? 0 : completedOrders.length} service reminders.`,
        );
    }
}
