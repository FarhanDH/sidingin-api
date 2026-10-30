import { InvoiceStatus } from '~/common/enums/invoice.enum';
import { PaymentMethod } from '~/common/enums/payment.enum';
import {
    OrderResponse,
    toOrderResponse,
} from '~/core/order/dto/order.response';
import { Invoice } from '../entities/invoice.entity';

export class InvoiceItemResponseDto {
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export class InvoiceResponseDto {
    id: string;
    order: OrderResponse;
    invoiceNumber: string;
    status: InvoiceStatus;
    totalAmount: number;
    issuedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    items: InvoiceItemResponseDto[];
    payment: {
        id: string;
        status: string;
        method: PaymentMethod;
        expiryTime: string;
        paymentChannel: string;
    } | null;
}

export const formatPaymentString = (str: string | null | undefined) => {
    if (!str) return null;
    return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};
export const toInvoiceResponseDto = (invoice: Invoice): InvoiceResponseDto => {
    return {
        id: invoice.id,
        order: toOrderResponse(invoice.order),
        invoiceNumber: invoice.invoice_number,
        status: invoice.status,
        totalAmount: invoice.total_amount,
        issuedAt: invoice.issued_at,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        items: invoice.items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            totalPrice: item.total_price,
        })),
        payment: invoice.payment
            ? {
                  id: invoice.payment.id,
                  status: invoice.payment.status,
                  method: invoice.payment.method,
                  expiryTime: invoice.payment.expiry_time as unknown as string,
                  paymentChannel: formatPaymentString(
                      (
                          invoice.payment.gateway_response as {
                              payment_type: string;
                          }
                      )?.payment_type,
                  ),
              }
            : null,
    };
};
