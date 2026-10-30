import { NotificationType } from '~/common/enums/notification-type.enum';
import { NotificationRead } from '~/core/notification-read/entities/notification-read.entity';
import { Notification } from '../entities/notification.entity';

export class NotificationResponse {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
    createdAt: Date;
    isRead: boolean;
    orderId?: string;
}

export const toNotificationResponse = (
    notification: Notification,
    userId: string,
): NotificationResponse => {
    const isRead = notification.reads.some(
        (read: NotificationRead) => read.user.id === userId,
    );

    const notificationResponse: NotificationResponse = {
        id: notification.id,
        title: notification.title,
        body: notification.message,
        type: notification.type,
        createdAt: notification.created_at,
        isRead,
    };

    //   Add detail order, if notification related with order
    if (notification.order) {
        notificationResponse.orderId = notification.order.id;
    }
    return notificationResponse;
};
