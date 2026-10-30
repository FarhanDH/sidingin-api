import { Injectable, Logger } from '@nestjs/common';
import { EarningResponse } from './dto/earning.response';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../order/entities/order.entity';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { OrderStatusEnum } from '~/common/enums/order-status.enum';
import { InvoiceStatus } from '~/common/enums/invoice.enum';
import { PaymentMethod } from '~/common/enums/payment.enum';
import { PaymentStatus } from '~/common/enums/payment-status.enum';
import { Not, In } from 'typeorm';
import {
    endOfDay,
    startOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
} from 'date-fns';

@Injectable()
export class EarningService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
    ) {}
    private readonly logger: Logger = new Logger(EarningService.name);

    /**
     * Calculates and returns a summary of earnings for a given technician over a specified period.
     * @param date - The reference date to calculate the period from.
     * @param technicianId - The ID of the technician.
     * @param period - The period for the summary ('daily', 'weekly', 'monthly'). Defaults to 'daily'.
     * @returns A promise that resolves to an EarningResponse object.
     */
    async getSummaryByDate(
        date: Date,
        technicianId: string,
        period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ): Promise<EarningResponse> {
        this.logger.debug(
            `EarningService.getSummaryByDate(${date}, ${technicianId}, ${period})`,
        );

        let startDate: Date;
        let endDate: Date;

        if (period === 'weekly') {
            startDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday
            endDate = endOfWeek(date, { weekStartsOn: 1 });
        } else if (period === 'monthly') {
            startDate = startOfMonth(date);
            endDate = endOfMonth(date);
        } else {
            // daily
            startDate = startOfDay(date);
            endDate = endOfDay(date);
        }

        // Get COMPLETED orders for the selected date (based on updated_at)
        const completedOrders = await this.orderRepository.find({
            where: {
                technician: { id: technicianId },
                status: OrderStatusEnum.COMPLETED,
                updated_at: Between(startDate, endDate),
            },
            relations: {
                invoice: { payment: true },
            },
        });

        // Get CANCELLED orders for the selected date (based on updated_at)
        const cancelledOrders = await this.orderRepository.find({
            where: {
                // For cancelled, it could be cancelled before a technician is assigned
                status: OrderStatusEnum.CANCELLED,
                updated_at: Between(startDate, endDate),
            },
        });

        // Get MISSED orders for the selected date (based on service_date)
        const missedOrders = await this.orderRepository.find({
            where: {
                technician: { id: technicianId },
                service_date: Between(startDate, endDate),
                status: Not(
                    In([OrderStatusEnum.COMPLETED, OrderStatusEnum.CANCELLED]),
                ),
            },
        });

        // Get PENDING orders for the selected date (unassigned)
        const pendingOrders = await this.orderRepository.count({
            where: {
                service_date: Between(startDate, endDate),
                status: OrderStatusEnum.PENDING,
            },
        });

        const totalMissed = missedOrders.length + pendingOrders;

        // Calculate totals based on completed orders only
        const earningTotal = completedOrders.reduce((total, order) => {
            if (order.invoice?.status === InvoiceStatus.PAID) {
                return total + Number(order.invoice.total_amount);
            }
            return total;
        }, 0);

        const cashPaymentTotal = completedOrders.reduce((total, order) => {
            const payment = order.invoice?.payment;
            if (
                payment &&
                payment.method === PaymentMethod.CASH &&
                payment.status === PaymentStatus.SUCCESS
            ) {
                return total + Number(payment.amount);
            }
            return total;
        }, 0);

        const digitalPaymentTotal = completedOrders.reduce((total, order) => {
            const payment = order.invoice?.payment;
            if (
                payment &&
                payment.method === PaymentMethod.MIDTRANS &&
                (payment.status === PaymentStatus.SETTLEMENT ||
                    payment.status === PaymentStatus.SUCCESS) // Midtrans uses SETTLEMENT
            ) {
                return total + Number(payment.amount);
            }
            return total;
        }, 0);

        return {
            orderTotal:
                completedOrders.length + cancelledOrders.length + totalMissed,
            earningTotal,
            cashPaymentTotal,
            cancelledOrderCount: cancelledOrders.length,
            completedOrderCount: completedOrders.length,
            missedOrderCount: totalMissed,
            digitalPaymentTotal,
            earningDate: date,
        };
    }
}
