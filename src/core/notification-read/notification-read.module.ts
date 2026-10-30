import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationRead } from './entities/notification-read.entity';

@Module({
    imports: [TypeOrmModule.forFeature([NotificationRead])],
})
export class NotificationReadModule {}
