import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpToken } from './entities/otp-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { PushSubscriptionModule } from '../push-subscription/push-subscription.module';

@Module({
    imports: [
        PushSubscriptionModule,
        TypeOrmModule.forFeature([OtpToken]),
        UserModule,
        JwtModule.register({ global: true }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
    exports: [AuthService],
})
export class AuthModule {}
