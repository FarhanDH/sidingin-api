import { OrderStatusEnum } from '~/common/enums/order-status.enum';
import { PaymentStatus } from '~/common/enums/payment-status.enum';
import { PaymentMethod } from '~/common/enums/payment.enum';
import { Order, Subject } from '../entities/order.entity';

export class OrderResponse {
    id: string;
    technician?: {
        id: string;
        name: string;
        avatarUrl: string;
        rating: number;
        phoneNumber: string;
    } | null;
    problems: string[];
    status: OrderStatusEnum;
    serviceLocation: {
        latitude: number;
        longitude: number;
        address: object;
        note?: string;
    };
    serviceDate: Date;
    propertyType: string;
    propertyFloor: string;
    note?: string;
    customer?: {
        id: string;
        fullName: string;
        phone: string;
    };
    acUnits: {
        id: number;
        acTypeName: string;
        acCapacity: string;
        brand: string;
        quantity: number;
    }[];
    cancellationReason?: string;
    cancellationNote?: string;
    cancelledBy?: Subject;
    totalUnits: number;
    invoiceId?: string;
    amount?: number;
    paymentMethod?: PaymentMethod;
    ratingStatus: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export const toOrderResponse = (
    order: Order,
    ratingStatus: string | null = null,
): OrderResponse => ({
    id: order.id,
    technician: order.technician
        ? {
              id: order.technician.id,
              avatarUrl: order.technician.avatar_url,
              name: order.technician.full_name,
              phoneNumber: order.technician.phone_number,
              rating: 4.8,
          }
        : null,
    problems: order.ac_problems,
    status: order.status,
    serviceLocation: {
        latitude: order.latitude_service_location,
        longitude: order.longitude_service_location,
        address: order.service_location_detail,
        note: order.service_location_note,
    },
    serviceDate: order.service_date,
    propertyType: order.property_type,
    propertyFloor: order.property_floor,
    note: order.note,
    customer: {
        id: order.customer.id,
        fullName: order.customer.full_name,
        phone: order.customer.phone_number,
    },
    acUnits: order.ac_units.map((acUnit) => ({
        id: acUnit.id,
        acTypeName: acUnit.ac_type_name,
        acCapacity: acUnit.ac_capacity,
        brand: acUnit.brand,
        quantity: acUnit.quantity,
    })),
    totalUnits: order.ac_units.reduce(
        (total, acUnit) => total + acUnit.quantity,
        0,
    ),
    invoiceId: order.invoice?.id || null,
    amount: order.invoice?.total_amount || 0,
    paymentMethod: (() => {
        const payment = order.invoice?.payment;
        if (
            payment &&
            [PaymentStatus.SETTLEMENT, PaymentStatus.SUCCESS].includes(
                payment.status,
            )
        ) {
            return payment.method;
        }
        return null;
    })(),
    cancellationReason: order.cancellation_reason,
    cancellationNote: order.cancellation_note,
    cancelledBy: order.cancelled_by,
    ratingStatus,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
});
