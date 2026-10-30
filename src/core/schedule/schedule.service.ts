import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { Repository } from 'typeorm';
import { AcUnit } from '../ac-unit/entities/ac-unit.entity';
import { OrderStatusEnum } from '~/common/enums/order-status.enum';

@Injectable()
export class ScheduleService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(AcUnit)
        private readonly acUnitRepository: Repository<AcUnit>,
    ) {}
    private readonly logger = new Logger(ScheduleService.name);

    async getScheduleAvailability(
        startDate: string,
        endDate: string,
    ): Promise<{ date: string; totalUnitsBooked: number }[]> {
        this.logger.debug(
            `ScheduleService.getScheduleAvailability(startDate: ${startDate}, endDate: ${endDate})`,
        );
        try {
            // Query the database to sum the quantity of AC units booked for each day between the start date and end date
            const result = await this.orderRepository
                .createQueryBuilder('orders')
                .innerJoin('orders.ac_units', 'ac_units')
                .select('DATE(orders.service_date)', 'date')
                .addSelect('SUM(ac_units.quantity)', 'totalUnitsBooked')
                .where('orders.service_date BETWEEN :startDate AND :endDate', {
                    startDate,
                    endDate,
                })
                .andWhere('orders.status NOT IN (:...statuses)', {
                    statuses: [
                        OrderStatusEnum.CANCELLED,
                        OrderStatusEnum.COMPLETED,
                    ],
                })
                .groupBy('DATE(orders.service_date)')
                .getRawMany();

            return result.map((item) => ({
                date: item.date,
                totalUnitsBooked: parseInt(item.totalUnitsBooked, 10),
            }));
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException(error);
        }
    }
}
