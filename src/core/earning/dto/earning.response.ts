import { Order } from '~/core/order/entities/order.entity';

export class EarningResponse {
    earningDate: Date;
    earningTotal: number;
    orderTotal: number;
    missedOrderCount: number;
    completedOrderCount: number;
    cancelledOrderCount: number;
    cashPaymentTotal: number;
    digitalPaymentTotal: number;
}

// export const toEarningResponse = (earning: Order): EarningResponse => {
//     return {
//         earningDate: earning.service_date,
//         earningTotal: earning.invoice.,
//         orderTotal: earning.orderTotal,
//         missedOrderCount: earning.missedOrderCount,
//         completedOrderCount: earning.completedOrderCount,
//         cancelledOrderCount: earning.cancelledOrderCount,
//         cashPaymentTotal: earning.cashPaymentTotal,
//         digitalPaymentTotal: earning.digitalPaymentTotal
//     }
// }
