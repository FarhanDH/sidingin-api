import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtPayload } from '../auth/dto/auth.response';
import { NotificationRead } from '../notification-read/entities/notification-read.entity';
import { CreateNotificationDto } from './dto/notification.request';
import {
    NotificationResponse,
    toNotificationResponse,
} from './dto/notification.response';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
        @InjectRepository(NotificationRead)
        private readonly notificationReadRepository: Repository<NotificationRead>,
    ) {}

    private readonly logger: Logger = new Logger(NotificationService.name);

    async create(createNotificationDto: CreateNotificationDto) {
        this.logger.debug(
            `NotificationService.create(): ${JSON.stringify(createNotificationDto)}`,
        );
        try {
            const notificationEntity = this.notificationRepository.create({
                title: createNotificationDto.title,
                message: createNotificationDto.message,
                type: createNotificationDto.type,
                recipient: { id: createNotificationDto.recipientId ?? null },
                order: { id: createNotificationDto.orderId ?? null },
            });

            const savedNotification =
                await this.notificationRepository.save(notificationEntity);

            return await this.getById(savedNotification.id);
        } catch (error) {
            this.logger.error(`Error creating notification: ${error}`);
            throw new InternalServerErrorException(
                'Failed to create notification',
            );
        }
    }

    async getById(id: string): Promise<Notification> {
        this.logger.debug(`NotificationService.getById(): ${id}`);
        return await this.notificationRepository.findOne({
            where: { id },
            relations: {
                recipient: true,
                reads: true,
            },
        });
    }

    /**
     * Get all notifications for a given user
     *
     * @param user to fetch notifications for
     * @returns An array of NotificationResponse objects, which include the notification
     *          details and a boolean indicating whether the notification has been read
     */
    async getAllNotificationByUser(
        user: JwtPayload,
    ): Promise<NotificationResponse[]> {
        this.logger.debug(
            `NotificationService.getAllNotificationByUser(): ${user.sub}`,
        );
        const notifications = await this.notificationRepository
            .createQueryBuilder('notification')
            .leftJoinAndSelect('notification.reads', 'reads')
            .leftJoinAndSelect('reads.user', 'readUser')
            .leftJoinAndSelect('notification.order', 'order')
            .where('notification.recipient.id = :userId', { userId: user.sub })
            .orWhere('notification.recipient IS NULL')
            .orderBy('notification.created_at', 'DESC')
            .getMany();

        // Return the notifications for
        return notifications.map((notification) =>
            toNotificationResponse(notification, user.sub),
        );
    }

    /**
     * Mark a notification as read by a user.
     *
     * @param userId The ID of the user marking the notification as read
     * @param notificationId The ID of the notification being marked as read
     * @throws InternalServerErrorException if the notification cannot be marked as read
     */
    async markAsRead(userId: string, notificationId: string): Promise<void> {
        // Check if the notification has already been marked as read
        const notificationReadExists = await this.notificationReadRepository
            .createQueryBuilder('read')
            .where('read.notification.id = :notificationId', {
                notificationId,
            })
            .andWhere('read.user.id = :userId', { userId })
            .getOne();

        if (!notificationReadExists) {
            // Create a new read entry if the notification isn't already marked as read
            const newReadEntry = this.notificationReadRepository.create({
                user: { id: userId },
                notification: { id: notificationId },
            });
            await this.notificationReadRepository.save(newReadEntry);
            this.logger.log(
                `Notification ${notificationId} marked as read by user ${userId}.`,
            );
        } else {
            // Log a message if the notification is already marked as read
            this.logger.log(
                `Notification ${notificationId} is already read by user ${userId}.`,
            );
        }
    }

    /**
     * Retrieves the count of unread notifications for a given user.
     *
     * @param userId The ID of the user for which the unread count should be retrieved.
     * @throws InternalServerErrorException if the unread count cannot be retrieved.
     * @returns An object containing the unread count.
     */
    async getUnreadCount(user: JwtPayload): Promise<{ unreadCount: number }> {
        this.logger.debug(`NotificationService.getUnreadCount(): ${user.sub}`);

        try {
            // Get all notifications for the given user
            const getAllNotifications =
                await this.getAllNotificationByUser(user);

            // Filter the notifications to only include unread ones and count them
            const unreadCount = getAllNotifications
                .filter((notification) => !notification.isRead)
                .reduce((acc, curr) => acc + 1, 0);

            // Log the result
            this.logger.log(
                `Unread count for user ${user.sub}: ${unreadCount}`,
            );

            // Return the count
            return { unreadCount };
        } catch (error) {
            // Catch any errors and log them
            this.logger.error(`Error getting unread count: ${error}`);

            // Throw an internal server error if the unread count cannot be retrieved
            throw new InternalServerErrorException(
                'Failed to get unread notification count.',
            );
        }
    }
}
