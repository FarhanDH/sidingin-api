import { Module } from '@nestjs/common';
import { PushSubscriptionService } from './push-subscription.service';
import { PushSubscriptionController } from './push-subscription.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscription } from './entities/push-subscription.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([PushSubscription]), UserModule],
    controllers: [PushSubscriptionController],
    providers: [PushSubscriptionService],
    exports: [PushSubscriptionService],
})
export class PushSubscriptionModule {}
