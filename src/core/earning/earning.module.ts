import { Module } from '@nestjs/common';
import { EarningService } from './earning.service';
import { EarningController } from './earning.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order])],
    controllers: [EarningController],
    providers: [EarningService],
})
export class EarningModule {}
