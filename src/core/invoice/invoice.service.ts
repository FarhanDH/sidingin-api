import { HttpService } from '@nestjs/axios';
import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as fs from 'fs';
import * as hbs from 'handlebars';
import { DataSource, Repository } from 'typeorm';
import { configuration } from '~/common/configuration';
import { InvoiceStatus } from '~/common/enums/invoice.enum';
import { NotificationType } from '~/common/enums/notification-type.enum';
import { OrderStatusEnum } from '~/common/enums/order-status.enum';
import { PaymentStatus } from '~/common/enums/payment-status.enum';
import { PaymentMethod } from '~/common/enums/payment.enum';
import { NotificationService } from '../notification/notification.service';
import { Order } from '../order/entities/order.entity';
import { OrderService } from '../order/order.service';
import { Payment } from '../payment/entities/payment.entity';
import { PushSubscriptionService } from '../push-subscription/push-subscription.service';
import { CreateInvoiceDto } from './dto/invoice.request';
import { toInvoiceResponseDto } from './dto/invoice.response';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Invoice } from './entities/invoice.entity';
import { PusherService } from '../pusher/pusher.service';

@Injectable()
export class InvoiceService {
    constructor(
        @InjectRepository(Invoice)
        private readonly invoiceRepository: Repository<Invoice>,
        private readonly httpService: HttpService,
        private readonly dataSource: DataSource,
        private readonly pushSubscriptionService: PushSubscriptionService,
        private readonly orderService: OrderService,
        private readonly notificationService: NotificationService,
        private readonly pusherService: PusherService,
    ) {}

    private readonly logger = new Logger(InvoiceService.name);

    /**
     * Creates a new invoice for a completed order.
     * This operation is transactional.
     * @param orderId - The ID of the order to create an invoice for.
     * @param createInvoiceDto - The invoice data.
     * @returns The newly created invoice entity.
     */
    async create(
        orderId: string,
        createInvoiceDto: CreateInvoiceDto,
        // ): Promise<InvoiceResponseDto> {
    ) {
        this.logger.debug(
            `InvoiceService.create(): orderId: ${orderId}, createInvoiceDto: ${JSON.stringify(createInvoiceDto)}`,
        );

        // Begin a transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            /// Find the order and lock it for update to prevent race conditions.
            const order: Order = await queryRunner.manager.findOne(Order, {
                where: { id: orderId },
                lock: { mode: 'pessimistic_write' },
                transaction: true,
            });

            if (!order) {
                throw new NotFoundException(
                    `Order with ID ${orderId} not found.`,
                );
            }

            const existingInvoice: Invoice = await queryRunner.manager.findOne(
                Invoice,
                {
                    where: { order: { id: orderId } },
                    lock: {
                        mode: 'pessimistic_write',
                        tables: ['orders'],
                    },
                    transaction: true,
                    relations: {
                        order: {
                            customer: true,
                        },
                    },
                },
            );

            if (existingInvoice) {
                this.logger.warn('Invoice already exists for this order.');
                throw new ConflictException(
                    'Tagihan untuk pesanan ini udah ada.',
                );
            }

            if (order.status !== OrderStatusEnum.ON_WORKING) {
                throw new ConflictException(
                    'Tagihan hanya bisa dibuat jika service udah selesai.',
                );
            }

            // Calculate total amount and prepare invoice items.
            let totalAmount = 0;
            const invoiceItemsToSave = createInvoiceDto.items.map((itemDto) => {
                const totalPrice = itemDto.quantity * itemDto.unitPrice;
                totalAmount += totalPrice;
                return queryRunner.manager.create(InvoiceItem, {
                    description: itemDto.description,
                    quantity: itemDto.quantity,
                    unit_price: itemDto.unitPrice,
                    total_price: totalPrice,
                });
            });
            await queryRunner.manager.save(invoiceItemsToSave);

            // Create the main invoice entity.
            const newInvoice = queryRunner.manager.create(Invoice, {
                order: order,
                invoice_number: `INV/${new Date().getFullYear()}/${orderId.slice(-6)}`,
                status: InvoiceStatus.UNPAID,
                total_amount: totalAmount,
                issued_at: new Date(),
                items: invoiceItemsToSave,
            });
            await queryRunner.manager.save(newInvoice);

            // Update the order status to WAITING_PAYMENT.
            order.status = OrderStatusEnum.WAITING_PAYMENT;
            await queryRunner.manager.save(order);
            // Commit the transaction.
            await queryRunner.commitTransaction();

            // Return the created invoice.
            const createdInvoice = await this.invoiceRepository.findOne({
                where: { order: { id: orderId } },
                relations: {
                    items: true,
                    payment: true,
                    order: {
                        customer: true,
                        technician: true,
                        ac_units: true,
                        invoice: true,
                    },
                },
            });

            const notification = await this.notificationService.create({
                recipientId: createdInvoice.order.customer.id,
                orderId: createdInvoice.order.id,
                type: NotificationType.INVOICE_CREATED,
                title: 'Kerjaan Beres, Tagihan Siap! 📃',
                message: `Mantap! AC-nya udah kelar diservis. Tagihannya udah ada, yuk langsung dibayar.`,
            });

            // Trigger REAL-TIME UPDATE
            const channelName = `order-${createdInvoice.order.id}-customer`;

            await this.pusherService.trigger(
                channelName,
                'status-updated-customer',
                {
                    orderId: createdInvoice.order.id,
                    newStatus: createdInvoice.order.status,
                    message: notification.title,
                },
            );

            await this.pushSubscriptionService.sendNotificationToUser(
                notification.recipient.id,
                {
                    title: notification.title,
                    body: notification.message,
                    tag: notification.type,
                    link: '/notifications',
                },
            );
            // return createdInvoice;
            return toInvoiceResponseDto(createdInvoice);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(
                `Failed to create invoice for order ${orderId}`,
                error,
            );
            throw new error.constructor(error.message);
        } finally {
            await queryRunner.release();
        }
    }

    async getByOrderId(id: string): Promise<Invoice> {
        this.logger.debug(`InvoiceService.getById: ${id}`);
        const data = await this.invoiceRepository.findOne({
            where: { order: { id } },
            relations: {
                payment: true,
                order: {
                    technician: true,
                    customer: true,
                },
                items: true,
            },
        });

        return data;
    }

    async getByIdWithUserId(id: string, userId: string): Promise<Invoice> {
        const data = await this.invoiceRepository.findOne({
            where: { id, order: { customer: { id: userId } } },
            relations: {
                payment: true,
                order: {
                    technician: true,
                    customer: true,
                },
                items: true,
            },
        });

        if (!data) {
            throw new NotFoundException(`Invoice with ID ${id} not found.`);
        }

        return data;
    }

    /**
     * Generates a PDF buffer for a given invoice.
     * @param invoiceId - The ID of the invoice.
     * @param customerId - The ID of the customer requesting the PDF.
     * @returns A Buffer containing the PDF file data.
     */
    async generatePdf(invoiceId: string, customerId: string): Promise<Buffer> {
        const invoice = await this.getByIdWithUserId(invoiceId, customerId);
        if (!invoice) {
            throw new NotFoundException('Invoice not found.');
        }

        const templatePath = __dirname + '/templates/invoice.hbs';
        const templateHtml = fs.readFileSync(templatePath, 'utf8');
        hbs.registerHelper('formatDate', function (dateString) {
            return format(new Date(dateString), 'd MMMM yyyy', { locale: id });
        });

        hbs.registerHelper('formatFullDate', function (dateString) {
            return format(new Date(dateString), 'd MMMM yyyy', {
                locale: id,
            });
        });

        hbs.registerHelper('formatCurrency', function (amount) {
            return Number(amount).toLocaleString('id-ID');
        });

        hbs.registerHelper(
            'formatPaymentMethod',
            function (payments: Payment[]) {
                if (!payments || payments.length === 0) {
                    return 'N/A';
                }

                const successfulPayment = payments.find(
                    (p) =>
                        p.status === PaymentStatus.SETTLEMENT ||
                        p.status === PaymentStatus.SUCCESS,
                );

                if (!successfulPayment) {
                    return 'Belum Dibayar';
                }

                if (successfulPayment.method === PaymentMethod.CASH) {
                    return 'Tunai';
                }

                if (successfulPayment.method === PaymentMethod.MIDTRANS) {
                    const channel = (successfulPayment.gateway_response as any)
                        ?.payment_type;
                    if (channel) {
                        return channel
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, (l) => l.toUpperCase());
                    }
                    return 'Pembayaran Digital';
                }

                return 'N/A';
            },
        );

        const template = hbs.compile(templateHtml);
        const html = template({
            invoice,
        });

        let browser;
        try {
            const browserlessEndpoint = `https://production-sfo.browserless.io/pdf?token=${configuration().browserless.apiKey}`;

            const apiPayload = {
                html: html,
                options: {
                    format: 'A4',
                    printBackground: true,
                    margin: {
                        top: '20px',
                        right: '20px',
                        bottom: '20px',
                        left: '20px',
                    },
                },
            };

            const response = await this.httpService.axiosRef.post(
                browserlessEndpoint,
                apiPayload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer', // !IMPORTANT
                },
            );

            // Send push notification to customer
            await this.pushSubscriptionService.sendNotificationToUser(
                invoice.order.customer.id,
                {
                    title: 'Sip, Tagihanmu Udah Di-Download!',
                    body: `Cek folder download atau dokumen di perangkat kamu, ya.`,
                    tag: NotificationType.INVOICE_DOWNLOADED,
                    link: `/notifications`,
                },
            );
            return Buffer.from(response.data);
        } catch (error) {
            this.logger.error(
                'Failed to generate PDF with Browserless:',
                JSON.stringify(error),
            );
            throw new error.constructor(error.message);
        } finally {
            // Selalu pastikan browser ditutup
            if (browser) {
                await browser.close();
            }
        }
    }
}
