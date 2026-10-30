import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { configuration } from './common/configuration';
import { DatabaseModule } from './core/database/database.module';
import { AppLoggerMiddleware } from './common/loggers/logger.middleware';
import { UserModule } from './core/user/user.module';
import { AuthModule } from './core/auth/auth.module';
import { EmailModule } from './core/email/email.module';
import { OrderModule } from './core/order/order.module';
import { AcUnitModule } from './core/ac-unit/ac-unit.module';
import { ScheduleModule } from './core/schedule/schedule.module';
import { PushSubscriptionModule } from './core/push-subscription/push-subscription.module';
import { NotificationModule } from './core/notification/notification.module';
import { NotificationReadModule } from './core/notification-read/notification-read.module';
import { ScheduledTaskModule } from './core/scheduled-task/scheduled-task.module';
import { InvoiceModule } from './core/invoice/invoice.module';
import { PaymentModule } from './core/payment/payment.module';
import { EarningModule } from './core/earning/earning.module';
import { PusherModule } from './core/pusher/pusher.module';
import { GeocodingModule } from './core/geocoding/geocoding.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RatingModule } from './core/rating/rating.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
            isGlobal: true,
            load: [configuration],
        }),
        ThrottlerModule.forRoot([
            {
                ttl: 60000,
                limit: 2000,
            },
        ]),
        DatabaseModule,
        UserModule,
        AuthModule,
        EmailModule,
        OrderModule,
        AcUnitModule,
        ScheduleModule,
        PushSubscriptionModule,
        NotificationModule,
        NotificationReadModule,
        ScheduledTaskModule,
        InvoiceModule,
        PaymentModule,
        EarningModule,
        PusherModule,
        GeocodingModule,
        RatingModule,
    ],
    controllers: [AppController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AppLoggerMiddleware).forRoutes('*');
    }
}
