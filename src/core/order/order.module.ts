import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcUnit } from '../ac-unit/entities/ac-unit.entity';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { NotificationModule } from '../notification/notification.module';
import { PushSubscriptionModule } from '../push-subscription/push-subscription.module';
import { PusherModule } from '../pusher/pusher.module';
import { UserModule } from '../user/user.module';
import { Order } from './entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { RatingModule } from '../rating/rating.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, AcUnit]),
        UserModule,
        PushSubscriptionModule,
        PusherModule,
        GeocodingModule,
        HttpModule,
        NotificationModule,
        RatingModule,
    ],
    controllers: [OrderController],
    providers: [OrderService],
    exports: [OrderService],
})
export class OrderModule {}
