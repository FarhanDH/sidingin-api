import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { InvoiceModule } from '../invoice/invoice.module';
import { NotificationModule } from '../notification/notification.module';
import { PushSubscriptionModule } from '../push-subscription/push-subscription.module';
import { HttpModule } from '@nestjs/axios';
import { PusherModule } from '../pusher/pusher.module';
import { OrderModule } from '../order/order.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment]),
        HttpModule,
        InvoiceModule,
        NotificationModule,
        OrderModule,
        PushSubscriptionModule,
        PusherModule,
    ],
    controllers: [PaymentController],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule {}
