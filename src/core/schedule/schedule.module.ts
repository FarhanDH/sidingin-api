import { Module } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { OrderModule } from '../order/order.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { AcUnit } from '../ac-unit/entities/ac-unit.entity';
import { ScheduleController } from './schedule.controller';

@Module({
    imports: [OrderModule, TypeOrmModule.forFeature([Order, AcUnit])],
    controllers: [ScheduleController],
    providers: [ScheduleService],
})
export class ScheduleModule {}
