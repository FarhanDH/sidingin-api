import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import webPush from 'web-push';
import { configuration } from '~/common/configuration';
import { RoleEnum } from '~/common/enums/role.enum';
import { JwtPayload } from '../auth/dto/auth.response';
import { UserService } from '../user/user.service';
import { CreatePushSubscriptionRequest } from './dto/push-subscription.request';
import { PushSubscription } from './entities/push-subscription.entity';
import { NotificationType } from '~/common/enums/notification-type.enum';

export type PayloadMessage = {
    title: string;
    body: string;
    tag: NotificationType;
    link?: string;
    notificationId?: string;
    userId?: string;
};

@Injectable()
export class PushSubscriptionService {
    constructor(
        @InjectRepository(PushSubscription)
        private readonly subscriptionRepository: Repository<PushSubscription>,
        private readonly userService: UserService,
    ) {
        webPush.setVapidDetails(
            configuration().webPush.vapidSubject,
            configuration().webPush.vapidPublicKey,
            configuration().webPush.vapidPrivateKey,
        );
    }

    private readonly logger: Logger = new Logger(PushSubscriptionService.name);

    async create(
        user: JwtPayload,
        subscription: CreatePushSubscriptionRequest,
    ) {
        this.logger.debug(
            `PushSubscriptionService.create(${JSON.stringify(user)}, ${JSON.stringify(subscription)})`,
        );

        // Is user exist
        const userEntity = await this.userService.getById(user.sub);
        if (!userEntity) throw new NotFoundException('User not found');

        // Is subscription exist
        const existingSubscriptionEntity =
            await this.subscriptionRepository.findOneBy({
                endpoint: subscription.endpoint,
            });

        // Do not save endpoint subscription
        if (existingSubscriptionEntity) {
            existingSubscriptionEntity.p256dh = subscription.keys.p256dh;
            existingSubscriptionEntity.auth = subscription.keys.auth;
            return this.subscriptionRepository.save(existingSubscriptionEntity);
        }

        const newSubscription = this.subscriptionRepository.create({
            user: userEntity,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        });

        const savedSubscription =
            await this.subscriptionRepository.save(newSubscription);

        const completeSubscription =
            await this.subscriptionRepository.findOneBy({
                id: savedSubscription.id,
            });

        const payloadMessage =
            userEntity.role === RoleEnum.CUSTOMER
                ? {
                      title: 'Kriing! Notifikasi udah nyala 🔔',
                      body: 'Semua update soal pesanan Anda bakal langsung dkabarin. 😉',
                      tag: 'subscription-activated',
                  }
                : {
                      title: 'Kriing! Notifikasi udah nyala 🔔',
                      body: 'Siap-siap, ya! Kalau ada pesanan baru, nanti bakal langsung dkabarin. 😉',
                      tag: 'subscription-activated',
                  };

        const result = await webPush.sendNotification(
            {
                endpoint: completeSubscription.endpoint,
                keys: {
                    auth: completeSubscription.auth,
                    p256dh: completeSubscription.p256dh,
                },
                expirationTime: completeSubscription.expirationTime
                    ? completeSubscription.expirationTime.getTime() / 1000
                    : null,
            },
            JSON.stringify(payloadMessage),
        );
        return result;
    }

    async deleteByEndpoint(endpoint: string) {
        this.logger.debug(
            `PushSubscriptionService.deleteByEndpoint(endpoint: ${endpoint})`,
        );

        const result = await this.subscriptionRepository.delete({ endpoint });

        if (result.affected === 0) {
            this.logger.warn(
                `No push subscription found with endpoint: ${endpoint}`,
            );
            // We don't throw an error, as the goal is to ensure it's gone.
        }

        return { message: 'Subscription deleted successfully' };
    }

    async getAllTechnicianSubscriptions() {
        this.logger.debug(
            `PushSubscriptionService.getAllTechnicianSubscriptions()`,
        );
        return await this.subscriptionRepository.find({
            where: { user: { role: RoleEnum.TECHNICIAN } },
            relations: { user: true },
        });
    }

    async sendNotifications(
        subscription: PushSubscription[],
        payload: PayloadMessage,
    ) {
        this.logger.debug(
            `PushSubscriptionService.sendNotifications(${JSON.stringify(subscription)}, ${JSON.stringify(payload)})`,
        );
        for (const sub of subscription) {
            try {
                await this.sendNotification(sub, payload);
            } catch (err) {
                // kalau expired, hapus
                if (err.statusCode === 410) {
                    await this.subscriptionRepository.remove(sub);
                }
            }
        }
    }

    async sendNotification(
        subscription: PushSubscription,
        payload: PayloadMessage,
    ) {
        return webPush.sendNotification(
            {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                },
            },
            JSON.stringify(payload),
        );
    }

    async sendNotificationToUser(userId: string, payload: PayloadMessage) {
        this.logger.debug(
            `PushSubscriptionService.sendNotificationToUser(${userId}, ${JSON.stringify(payload)})`,
        );
        const subs = await this.subscriptionRepository.find({
            where: { user: { id: userId } },
            relations: { user: true },
        });

        for (const sub of subs) {
            try {
                await this.sendNotification(sub, payload);
            } catch (err) {
                // kalau expired, hapus
                if (err.statusCode === 410) {
                    await this.subscriptionRepository.remove(sub);
                }
            }
        }
    }
}
