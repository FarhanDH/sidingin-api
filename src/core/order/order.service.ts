import {
    BadRequestException,
    ConflictException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    addDays,
    endOfDay,
    endOfMonth,
    endOfWeek,
    startOfDay,
    startOfMonth,
    startOfWeek,
} from 'date-fns';
import {
    Between,
    DataSource,
    FindOptionsWhere,
    In,
    IsNull,
    LessThanOrEqual,
    MoreThanOrEqual,
    Not,
    Repository,
} from 'typeorm';
import { NotificationType } from '~/common/enums/notification-type.enum';
import { OrderDateFilter } from '~/common/enums/order-date.enum';
import { OrderStatusEnum } from '~/common/enums/order-status.enum';
import { calculateDistanceInMeters } from '~/common/utils';
import { AcUnit } from '../ac-unit/entities/ac-unit.entity';
import { JwtPayload } from '../auth/dto/auth.response';
import { GeocodingService } from '../geocoding/geocoding.service';
import {
    InvoiceResponseDto,
    toInvoiceResponseDto,
} from '../invoice/dto/invoice.response';
import { NotificationService } from '../notification/notification.service';
import {
    PayloadMessage,
    PushSubscriptionService,
} from '../push-subscription/push-subscription.service';
import { PusherService } from '../pusher/pusher.service';
import { UserService } from '../user/user.service';
import {
    CancelOrderRequestDto,
    CreateOrderRequestDto,
    UpdateOrderStatusRequestDto,
} from './dto/order.request';
import { OrderResponse, toOrderResponse } from './dto/order.response';
import { Order } from './entities/order.entity';
import { RatingService } from '../rating/rating.service';

const SERVICE_RADIUS_METERS = 200;

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        private readonly userService: UserService,
        private readonly pushSubscriptionService: PushSubscriptionService,
        private readonly notificationService: NotificationService,
        private readonly dataSource: DataSource,
        private readonly pusherService: PusherService,
        private readonly geocodingService: GeocodingService,
        private readonly ratingService: RatingService,
    ) {}

    private readonly logger = new Logger(OrderService.name);

    /**
     * Ensures that an order has its address details populated.
     * If an order is missing address details, it fetches them using the geocoding service
     * and asynchronously updates the database entry.
     * @param order - An Order entity.
     * @returns A promise that resolves to the order with populated address details.
     */
    private async enrichOrderWithAddress(order: Order): Promise<Order> {
        if (
            order &&
            !order.service_location_detail &&
            order.latitude_service_location &&
            order.longitude_service_location
        ) {
            try {
                const addressDetail =
                    await this.geocodingService.reverseGeocode(
                        order.latitude_service_location,
                        order.longitude_service_location,
                    );
                order.service_location_detail = addressDetail;

                // Asynchronously update the database without blocking the response
                this.orderRepository
                    .update(order.id, {
                        service_location_detail: addressDetail,
                    })
                    .catch((err) =>
                        this.logger.error(
                            `Failed to update order address in DB for order ${order.id}:`,
                            err,
                        ),
                    );
            } catch (err) {
                this.logger.error(
                    `Failed to geocode for order ${order.id}:`,
                    err,
                );
                // If geocoding fails, we still return the order as is.
            }
        }
        return order;
    }

    /**
     * Creates a new order for a customer, including AC unit details, within a transaction.
     * Checks for schedule availability before creating the order.
     * @param user - The JWT payload of the authenticated customer.
     * @param createOrderDto - The data transfer object containing details for the new order.
     * @returns A promise that resolves to the created order response.
     */
    async createForCustomer(
        user: JwtPayload,
        createOrderDto: CreateOrderRequestDto,
    ): Promise<OrderResponse> {
        this.logger.debug(
            `OrderService.createForCustomer: ${JSON.stringify(createOrderDto)}`,
        );

        // Start Transaction
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check schedule availability
            // Parse the date string as UTC. new Date('YYYY-MM-DD') creates a UTC date.
            const serviceDate = new Date(createOrderDto.serviceDate);

            if (serviceDate.getDay() === 0) {
                throw new BadRequestException(
                    'Layanan tidak tersedia di hari Minggu.',
                );
            }

            // Get the start and end of the day for the service date in UTC.
            // This ensures that the query is independent of the server's timezone.
            const dayStart = startOfDay(serviceDate);
            const dayEnd = endOfDay(serviceDate);

            // Query the database to sum the quantity of AC units booked for the given service date.
            // It excludes orders that are cancelled or completed to only count active bookings.
            // The query uses a raw SQL query to join 'orders' with 'ac_units' and sum the quantities.
            const scheduleCheck = await queryRunner.manager
                .createQueryBuilder(Order, 'orders')
                .select('SUM(ac_units.quantity)', 'totalUnitsBooked')
                .innerJoin('orders.ac_units', 'ac_units')
                .where('orders.service_date BETWEEN :dayStart AND :dayEnd', {
                    dayStart,
                    dayEnd,
                })
                .andWhere('orders.status NOT IN (:...statuses)', {
                    statuses: [
                        OrderStatusEnum.CANCELLED,
                        OrderStatusEnum.COMPLETED,
                    ],
                })
                .getRawOne();

            // Parse the total units booked from the database result, defaulting to 0 if null.
            const totalUnitsBooked =
                parseInt(scheduleCheck?.totalUnitsBooked, 10) || 0;
            // Calculate the total quantity of AC units in the new order being created.
            const totalUnitsInNewOrder = createOrderDto.acUnits.reduce(
                (acc, acUnit) => acc + acUnit.quantity,
                0,
            );

            // If slot unavailable, cancel transaction and throw an exception
            // Check if adding the new order's AC units would exceed the maximum capacity (10 units).
            if (totalUnitsBooked + totalUnitsInNewOrder > 10) {
                this.logger.warn(
                    `Slot for ${serviceDate} is full. Cannot create new order.`,
                );

                throw new ConflictException(
                    'Jadwal udah penuh. Silakan pilih tanggal lain.',
                );
            }

            // Fetch address detail from Nominatim
            let serviceLocationDetail = null;
            try {
                const data = await this.geocodingService.reverseGeocode(
                    createOrderDto.serviceLocation.latitude,
                    createOrderDto.serviceLocation.longitude,
                );
                serviceLocationDetail = data;
            } catch (err) {
                this.logger.error(
                    `Failed to reverse geocode on order creation: ${err.message}`,
                );
                // Continue without address detail if Nominatim fails
            }

            // If slot available, continue to process create order
            // Ensure all save operations using queryRunner.manager
            // Create a new Order entity with the provided details and associate it with the customer.
            const newOrder = queryRunner.manager.create(Order, {
                customer: {
                    id: user.sub,
                },
                ac_problems: createOrderDto.acProblems,
                latitude_service_location:
                    createOrderDto.serviceLocation.latitude,
                longitude_service_location:
                    createOrderDto.serviceLocation.longitude,
                service_location_detail: serviceLocationDetail,
                service_location_note: createOrderDto.serviceLocation.note,
                property_type: createOrderDto.propertyType,
                property_floor: createOrderDto.floor.toString(),
                service_date: createOrderDto.serviceDate,
                note: createOrderDto.note,
            });

            // Save the new order to the database within the transaction.
            const savedOrder = await queryRunner.manager.save(newOrder);

            // Save related AC Unit
            // Map the AC unit details from the DTO to new AcUnit entities, linking them to the newly saved order.
            const acUnitsToSave = createOrderDto.acUnits.map((acUnit) =>
                queryRunner.manager.create(AcUnit, {
                    orders: savedOrder, // Relate to created new order
                    ac_type_name: acUnit.acTypeId,
                    ac_capacity: acUnit.acCapacity,
                    brand: acUnit.brand,
                    quantity: acUnit.quantity,
                }),
            );
            // Save all the associated AC unit entities to the database within the transaction.
            await queryRunner.manager.save(acUnitsToSave);
            // Commit transaction
            // If all operations are successful, commit the transaction to make changes permanent.
            await queryRunner.commitTransaction();

            const technicians = await this.userService.getAllTechnicians();

            if (technicians.length > 0) {
                const notificationCreationPromise = Promise.all(
                    technicians.map((technician) =>
                        this.notificationService.create({
                            orderId: savedOrder.id,
                            recipientId: technician.id,
                            title: 'Pesanan Baru, Nih! 🔔',
                            message:
                                'Ada pelanggan baru yang butuh bantuanmu. Langsung cek detailnya, yuk!',
                            type: NotificationType.NEW_ORDER,
                        }),
                    ),
                );

                const technicianSubscriptionsPromise =
                    this.pushSubscriptionService.getAllTechnicianSubscriptions();

                const [, technicianSubscriptions] = await Promise.all([
                    notificationCreationPromise,
                    technicianSubscriptionsPromise,
                ]);

                if (technicianSubscriptions?.length > 0) {
                    await this.pushSubscriptionService.sendNotifications(
                        technicianSubscriptions,
                        {
                            title: 'Orderan Masuk, Nih! 🚀',
                            body: 'Ada pelanggan baru yang butuh bantuanmu. Langsung cek detailnya, yuk!',
                            tag: NotificationType.NEW_ORDER,
                            link: `/technician/notifications`,
                        },
                    );
                }
            } else {
                this.logger.warn(
                    'No technicians found to notify for new order.',
                );
                throw new NotFoundException(
                    'Kayaknya teknisi lagi gak ada. Coba lagi nanti',
                );
            }

            // Get new order for response
            const completeOrder = await this.orderRepository.findOne({
                where: { id: savedOrder.id },
                relations: {
                    technician: true,
                    ac_units: true,
                    customer: true,
                },
            });

            // Enrich before returning
            const enrichedOrder =
                await this.enrichOrderWithAddress(completeOrder);

            return toOrderResponse(enrichedOrder);
        } catch (error) {
            // Rollback transaction
            await queryRunner.rollbackTransaction();
            this.logger.error(error);
            throw new error.constructor(
                error.message || 'Failed to create order',
            );
        } finally {
            // Release query runner
            await queryRunner.release();
        }
    }

    async getAllForCustomer(
        user: JwtPayload,
        status?: OrderStatusEnum | 'progress',
        countOnly?: boolean,
        accessToken?: string,
    ): Promise<OrderResponse[]> {
        this.logger.debug(
            `OrderService.getAllByCustomer(user: ${JSON.stringify(user)}, status: ${JSON.stringify(status)})`,
        );

        if (countOnly) {
            const countQuery = async (
                statusFilter: OrderStatusEnum[] | 'progress',
            ): Promise<number> => {
                let where: FindOptionsWhere<Order>['status'];
                if (statusFilter === 'progress') {
                    where = Not(
                        In([
                            OrderStatusEnum.CANCELLED,
                            OrderStatusEnum.COMPLETED,
                        ]),
                    );
                } else {
                    where = In(statusFilter);
                }

                return this.orderRepository.count({
                    where: {
                        customer: { id: user.sub },
                        status: where,
                    },
                });
            };

            const [progressCount, completedCount, cancelledCount] =
                await Promise.all([
                    countQuery('progress'),
                    countQuery([OrderStatusEnum.COMPLETED]),
                    countQuery([OrderStatusEnum.CANCELLED]),
                ]);

            return {
                progress: progressCount,
                completed: completedCount,
                cancelled: cancelledCount,
            } as any;
        }

        // Get all orders with status is not completed and cancelled
        if (status === 'progress') {
            const orders = await this.orderRepository.find({
                where: [
                    {
                        customer: {
                            id: user.sub,
                        },
                        status: Not(
                            In([
                                OrderStatusEnum.CANCELLED,
                                OrderStatusEnum.COMPLETED,
                            ]),
                        ),
                    },
                ],
                order: {
                    service_date: 'asc',
                },
                relations: {
                    technician: true,
                    ac_units: true,
                    customer: true,
                },
            });
            const enrichedOrders = await Promise.all(
                orders.map((order) => this.enrichOrderWithAddress(order)),
            );

            return enrichedOrders.map((order) => toOrderResponse(order));
        }

        const orders = await this.orderRepository.find({
            where: {
                customer: {
                    id: user.sub,
                },
                status: status,
            },
            order: {
                updated_at: 'desc',
            },
            relations: {
                technician: true,
                ac_units: true,
                customer: true,
            },
        });
        const enrichedOrders = await Promise.all(
            orders.map((order) => this.enrichOrderWithAddress(order)),
        );

        let ratingStatuses: Record<string, string> | undefined;
        if (status === OrderStatusEnum.COMPLETED) {
            ratingStatuses = await this.ratingService.getBatchStatus(
                orders.map((order) => order.id),
                accessToken,
            );
        }
        return enrichedOrders.map((order) =>
            toOrderResponse(order, ratingStatuses?.[order.id] ?? null),
        );
    }

    async getAllForTechnician(
        user: JwtPayload,
        serviceDate?: OrderDateFilter | Date,
        status?: 'completed' | 'cancelled' | 'missed',
        countOnly?: boolean,
        period: 'daily' | 'weekly' | 'monthly' = 'daily',
    ): Promise<OrderResponse[]> {
        this.logger.debug(
            `OrderService.getAllForTechnician(user: ${JSON.stringify(user)}, serviceDate: ${JSON.stringify(serviceDate)}, status: ${status}, period: ${period})`,
        );

        let whereClause: FindOptionsWhere<Order> | FindOptionsWhere<Order>[] =
            {};

        if (countOnly) {
            // const counts = {
            //     today: 0,
            //     tomorrow: 0,
            //     upcoming: 0,
            // };

            const countQuery = async (
                dateFilter: OrderDateFilter,
            ): Promise<number> => {
                let dateClause: FindOptionsWhere<Order>['service_date'];
                if (dateFilter === OrderDateFilter.TODAY) {
                    dateClause = Between(
                        startOfDay(new Date()),
                        endOfDay(new Date()),
                    );
                } else if (dateFilter === OrderDateFilter.TOMORROW) {
                    const tomorrow = addDays(new Date(), 1);
                    dateClause = Between(
                        startOfDay(tomorrow),
                        endOfDay(tomorrow),
                    );
                } else {
                    // upcoming
                    dateClause = MoreThanOrEqual(
                        startOfDay(addDays(new Date(), 2)),
                    );
                }

                return this.orderRepository.count({
                    where: {
                        service_date: dateClause,
                        status: Not(
                            In([
                                OrderStatusEnum.CANCELLED,
                                OrderStatusEnum.COMPLETED,
                            ]),
                        ),
                    },
                });
            };

            const [todayCount, tomorrowCount, upcomingCount] =
                await Promise.all([
                    countQuery(OrderDateFilter.TODAY),
                    countQuery(OrderDateFilter.TOMORROW),
                    countQuery(OrderDateFilter.UPCOMING),
                ]);

            return {
                today: todayCount,
                tomorrow: tomorrowCount,
                upcoming: upcomingCount,
            } as any;
        }

        if (
            serviceDate !== OrderDateFilter.TODAY &&
            serviceDate !== OrderDateFilter.TOMORROW &&
            serviceDate !== OrderDateFilter.UPCOMING
        ) {
            let startDate: Date;
            let endDate: Date;

            if (period === 'weekly') {
                startDate = startOfWeek(serviceDate, { weekStartsOn: 1 });
                endDate = endOfWeek(serviceDate, { weekStartsOn: 1 });
            } else if (period === 'monthly') {
                startDate = startOfMonth(serviceDate);
                endDate = endOfMonth(serviceDate);
            } else {
                startDate = startOfDay(serviceDate);
                endDate = endOfDay(serviceDate);
            }
            whereClause.service_date = Between(startDate, endDate);
        } else {
            // For today, tomorrow, upcoming, we only show not completed/cancelled orders
            switch (serviceDate) {
                case OrderDateFilter.TODAY: {
                    const todayStart = startOfDay(new Date());
                    const todayEnd = endOfDay(new Date());
                    whereClause.service_date = Between(todayStart, todayEnd);
                    break;
                }
                case OrderDateFilter.TOMORROW: {
                    const tomorrow = addDays(new Date(), 1);
                    const tomorrowStart = startOfDay(tomorrow);
                    const tomorrowEnd = endOfDay(tomorrow);
                    whereClause.service_date = Between(
                        tomorrowStart,
                        tomorrowEnd,
                    );
                    break;
                }
                case OrderDateFilter.UPCOMING: {
                    const upcomingDate = startOfDay(addDays(new Date(), 2));
                    whereClause.service_date = MoreThanOrEqual(upcomingDate);
                    break;
                }
            }
            whereClause.status = Not(
                In([OrderStatusEnum.CANCELLED, OrderStatusEnum.COMPLETED]),
            );
        }

        if (status) {
            // If the status is completed or cancelled, the date filter should apply to `updated_at`.
            // Otherwise, it applies to `service_date`.
            const dateColumn =
                status === 'completed' || status === 'cancelled'
                    ? 'updated_at'
                    : 'service_date';

            const dateFilterValue = whereClause.service_date;
            delete whereClause.service_date; // Remove service_date to avoid conflict

            if (status === 'completed') {
                whereClause = {
                    ...whereClause,
                    [dateColumn]: dateFilterValue,
                    status: OrderStatusEnum.COMPLETED,
                    technician: { id: user.sub },
                };
            } else if (status === 'cancelled') {
                whereClause = {
                    ...whereClause,
                    [dateColumn]: dateFilterValue,
                    status: OrderStatusEnum.CANCELLED,
                };
            } else if (status === 'missed') {
                whereClause = [
                    // Orders assigned to the technician but not completed/cancelled
                    {
                        service_date: dateFilterValue,
                        technician: { id: user.sub },
                        status: Not(
                            In([
                                OrderStatusEnum.COMPLETED,
                                OrderStatusEnum.CANCELLED,
                            ]),
                        ),
                    },
                    // Pending orders for the date without a technician
                    {
                        service_date: dateFilterValue,
                        technician: IsNull(),
                        status: OrderStatusEnum.PENDING,
                    },
                ];
            }
        } else if (serviceDate) {
            // Default behavior for technician dashboard if no status is provided
        }

        this.logger.debug(
            `Executing query with where clause: ${JSON.stringify(whereClause)}`,
        );

        const orders = await this.orderRepository.find({
            where: whereClause,
            relations: {
                technician: true,
                ac_units: true,
                customer: true,
                invoice: {
                    items: true,
                    payment: true,
                },
            },
            order: {
                service_date: 'ASC',
            },
        });

        const enrichedOrders = await Promise.all(
            orders.map((order) => this.enrichOrderWithAddress(order)),
        );
        return enrichedOrders.map((order) => toOrderResponse(order));
    }

    async getOneByIdForTechnician(
        user: JwtPayload,
        orderId: string,
    ): Promise<OrderResponse> {
        this.logger.debug(
            `OrderService.getOneByIdForTechnician(user: ${JSON.stringify(user)}, orderId: ${orderId})`,
        );
        try {
            const order = await this.orderRepository.findOne({
                where: { id: orderId },
                relations: {
                    technician: true,
                    ac_units: true,
                    customer: true,
                    invoice: true,
                },
            });
            if (!order) {
                this.logger.warn(`Order with id ${orderId} not found`);
                throw new NotFoundException(
                    `Order with id ${orderId} not found`,
                );
            }
            const enrichedOrder = await this.enrichOrderWithAddress(order);

            return toOrderResponse(enrichedOrder);
        } catch (error) {
            this.logger.error(error);
            throw new InternalServerErrorException(error.message);
        }
    }

    async getInvoiceByOrderId(orderId: string): Promise<InvoiceResponseDto> {
        this.logger.debug(
            `OrderService.getInvoiceByOrderId(orderId: ${orderId})`,
        );

        const invoiceById = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: {
                invoice: {
                    payment: true,
                    order: {
                        customer: true,
                        ac_units: true,
                        technician: true,
                    },
                    items: true,
                },
            },
        });

        if (!invoiceById) {
            this.logger.warn(`Invoice with id ${orderId} not found`);
            throw new NotFoundException(`Invoice with id ${orderId} not found`);
        }

        const enrichedOrder = await this.enrichOrderWithAddress(
            invoiceById.invoice.order,
        );
        invoiceById.invoice.order = enrichedOrder;

        return toInvoiceResponseDto(invoiceById.invoice);
    }

    /**
     * Updates the status of an order as a technician.
     * @param user - The JWT payload of the authenticated technician.
     * @param orderId - The ID of the order to be updated.
     * @param updateStatusDto - The request body containing the status to be updated.
     * @returns A promise that resolves to the updated order response.
     * @throws {@link NotFoundException} if the order with the given ID is not found.
     * @throws {@link BadRequestException} if the technician is not within the service radius when updating to 'ON_WORKING'.
     * @throws {@link InternalServerErrorException} if an error occurs while updating the order status.
     */
    async updateStatusByIdForTechnician(
        user: any,
        orderId: string,
        updateStatusDto: UpdateOrderStatusRequestDto,
    ): Promise<OrderResponse> {
        this.logger.debug(
            `OrderService.updateStatusByIdForTechnician(user: ${JSON.stringify(
                user,
            )}, orderId: ${orderId}, updateStatusDto: ${JSON.stringify(updateStatusDto)})`,
        );
        try {
            const order = await this.orderRepository.findOne({
                where: { id: orderId },
                relations: {
                    technician: true,
                    ac_units: true,
                    customer: true,
                },
            });

            if (!order) {
                this.logger.warn(`Order with id ${orderId} not found`);
                throw new NotFoundException(
                    `Order with id ${orderId} not found`,
                );
            }

            // Check if the technician is within the service radius before updating to 'ON_WORKING'
            if (updateStatusDto.status === OrderStatusEnum.ON_WORKING) {
                if (
                    !updateStatusDto.technicianLatitude ||
                    !updateStatusDto.technicianLongitude
                ) {
                    throw new BadRequestException(
                        'Koordinat teknisi diperlukan untuk memulai pekerjaan.',
                    );
                }

                const technicianPosition = {
                    lat: updateStatusDto.technicianLatitude,
                    lng: updateStatusDto.technicianLongitude,
                };
                const serviceLocation = {
                    lat: order.latitude_service_location,
                    lng: order.longitude_service_location,
                };

                const distance = calculateDistanceInMeters(
                    technicianPosition,
                    serviceLocation,
                );

                if (distance > SERVICE_RADIUS_METERS) {
                    throw new BadRequestException(
                        'Teknisi terlalu jauh dari lokasi servis.',
                    );
                }
            }

            // Get the technician entity from the database
            console.log(user);
            const technicianEntity = await this.userService.getById(user.sub);

            // Update the order status and technician
            order.status = updateStatusDto.status;
            order.technician = technicianEntity;
            await this.orderRepository.save(order);

            // Create a notification for the customer
            const notificationMessage = this.updateStatusNotificationMessage(
                order.customer.full_name.split(' ')[0],
                updateStatusDto.status,
            );
            const savedNotification = await this.notificationService.create({
                orderId: order.id,
                recipientId: order.customer.id,
                title: notificationMessage.title,
                message: notificationMessage.body,
                type: notificationMessage.tag,
            });

            // Trigger REAL-TIME UPDATE
            const channelName = `order-${order.id}-customer`;

            await this.pusherService.trigger(
                channelName,
                'status-updated-customer',
                {
                    orderId: order.id,
                    newStatus: order.status,
                    message: savedNotification.title,
                },
            );

            // Send the notification to the customer
            await this.pushSubscriptionService.sendNotificationToUser(
                savedNotification.recipient.id,
                {
                    title: savedNotification.title,
                    body: savedNotification.message,
                    tag: savedNotification.type,
                    link: `/notifications`,
                    notificationId: savedNotification.id,
                },
            );

            const enrichedOrder = await this.enrichOrderWithAddress(order);

            return toOrderResponse(enrichedOrder);
        } catch (error) {
            this.logger.error(`Error updating order status: ${error.message}`);
            throw new InternalServerErrorException(error.message);
        }
    }

    async getAllByDate(date: Date): Promise<OrderResponse[]> {
        this.logger.debug(`OrderService.getAllByDate(date: ${date})`);
        const orders = await this.orderRepository.find({
            where: {
                service_date: date,
            },
            relations: {
                technician: true,
                ac_units: true,
                customer: true,
                invoice: {
                    items: true,
                    payment: true,
                },
            },
            order: {
                service_date: 'ASC',
            },
        });
        const enrichedOrders = await Promise.all(
            orders.map((order) => this.enrichOrderWithAddress(order)),
        );
        return enrichedOrders.map((order) => toOrderResponse(order));
    }

    /**
     * Finds an order by its ID.
     * @param id - The ID of the order to be found.
     * @returns A promise that resolves to the found order.
     * @throws {@link InternalServerErrorException} if an error occurs while finding the order.
     */
    async getById(id: string): Promise<Order> {
        this.logger.debug(`OrderService.getById(id: ${id})`);
        const order = await this.orderRepository.findOne({
            where: { id },
            relations: {
                ac_units: true,
                customer: true,
                technician: true,
            },
        });

        return this.enrichOrderWithAddress(order);
    }

    /**
     * Cancels an order as a customer.
     * @param user - The JWT payload of the authenticated customer.
     * @param orderId - The ID of the order to be cancelled.
     * @param request - The request body containing the cancellation reason and note.
     * @returns A promise that resolves to the cancelled order response.
     * @throws {@link NotFoundException} if the order with the given ID is not found.
     * @throws {@link InternalServerErrorException} if an error occurs while cancelling the order.
     */
    async cancelByIdForCustomer(
        user: JwtPayload,
        orderId: string,
        request: CancelOrderRequestDto,
    ): Promise<OrderResponse> {
        this.logger.debug(
            `OrderService.cancelByIdForCustomer(user: ${JSON.stringify(
                user,
            )}, orderId: ${orderId}, request: ${JSON.stringify(request)})`,
        );
        try {
            // Get order by order id and customer id
            const order = await this.orderRepository.findOne({
                where: { id: orderId, customer: { id: user.sub } },
                relations: {
                    ac_units: true,
                    customer: true,
                    technician: true,
                },
            });
            if (!order) {
                this.logger.warn(`Order with id ${orderId} not found`);
                throw new NotFoundException(
                    `Order with id ${orderId} not found`,
                );
            }

            // is status order still pending
            if (order.status !== OrderStatusEnum.PENDING) {
                this.logger.warn(
                    `Order with id ${orderId} is not in pending status`,
                );
                throw new Error(
                    `Order with id ${orderId} is not in pending status`,
                );
            }

            // Update order data
            order.status = OrderStatusEnum.CANCELLED;
            if (request.reason === 'Alasan lainnya') {
                order.cancellation_reason = request.note; // Store custom reason in the main reason field
                order.cancellation_note = null; // Clear the note field as it's now the main reason
            } else {
                order.cancellation_reason = request.reason;
                order.cancellation_note = request.note;
            }
            order.cancelled_by = {
                id: user.sub,
                role: user.role,
                fullName: user.fullName,
            };

            await this.orderRepository.save(order);

            // Notification received by all technicians
            const technicians = await this.userService.getAllTechnicians();
            const notificationMassage = {
                title: 'Yah, Pesanan Dibatalkan Pelanggan 🥲',
                message:
                    'Sabar ya. Tetap semangat!, masih banyak yang butuh bantuanmu!',
                type: NotificationType.CANCELLED_ORDER,
            };
            const savedNotification = technicians.map(async (technician) => {
                return await this.notificationService.create({
                    orderId: order.id,
                    recipientId: technician.id,
                    ...notificationMassage,
                });
            });
            const savedNotifications = await Promise.all(savedNotification);

            // Trigger REAL-TIME UPDATE
            const channelName = `order-${order.id}-technician`;

            await this.pusherService.trigger(
                channelName,
                'status-updated-technician',
                {
                    orderId: order.id,
                    newStatus: order.status,
                    message: notificationMassage.title,
                },
            );

            const technicianSubscriptions =
                await this.pushSubscriptionService.getAllTechnicianSubscriptions();

            await this.pushSubscriptionService.sendNotifications(
                technicianSubscriptions,
                {
                    title: savedNotifications[0].title,
                    body: savedNotifications[0].message,
                    tag: savedNotifications[0].type,
                    link: `/technician/notifications`,
                },
            );
            const enrichedOrder = await this.enrichOrderWithAddress(order);

            return toOrderResponse(enrichedOrder);
        } catch (error) {
            this.logger.error(`Error canceling order: ${error.message}`);
            throw new InternalServerErrorException(error.message);
        }
    }

    /**
     * Cancels an order as a technician.
     * @param user - The JWT payload of the authenticated technician.
     * @param orderId - The ID of the order to be cancelled.
     * @param request - The request body containing the cancellation reason and note.
     * @returns A promise that resolves to the cancelled order response.
     * @throws {@link NotFoundException} if the order with the given ID is not found.
     * @throws {@link InternalServerErrorException} if an error occurs while cancelling the order.
     */
    async cancelByIdForTechnician(
        user: JwtPayload,
        orderId: string,
        request: CancelOrderRequestDto,
    ): Promise<OrderResponse> {
        this.logger.debug(
            `OrderService.cancelByIdForTechnician(user: ${JSON.stringify(
                user,
            )}, orderId: ${orderId}, request: ${JSON.stringify(request)})`,
        );
        try {
            // Get order by order id and technician id
            const order = await this.orderRepository.findOne({
                where: { id: orderId, technician: { id: user.sub } },
                relations: {
                    technician: true,
                    ac_units: true,
                    customer: true,
                },
            });
            if (!order) {
                this.logger.warn(`Order with id ${orderId} not found`);
                throw new NotFoundException(
                    `Order with id ${orderId} not found`,
                );
            }

            // Update order data
            order.status = OrderStatusEnum.CANCELLED;
            if (request.reason === 'Alasan lainnya') {
                order.cancellation_reason = request.note; // Store custom reason in the main reason field
                order.cancellation_note = null; // Clear the note field as it's now the main reason
            } else {
                order.cancellation_reason = request.reason;
                order.cancellation_note = request.note;
            }
            order.cancelled_by = {
                id: user.sub,
                role: user.role,
                fullName: user.fullName,
            };

            await this.orderRepository.save(order);

            // Set notification message
            const notificationMassage = this.updateStatusNotificationMessage(
                order.customer.full_name.split(' ')[0],
                OrderStatusEnum.CANCELLED,
            );

            // Trigger REAL-TIME UPDATE
            const channelName = `order-${order.id}-customer`;

            await this.pusherService.trigger(
                channelName,
                'status-updated-customer',
                {
                    orderId: order.id,
                    newStatus: order.status,
                    message: notificationMassage.title,
                },
            );
            // Save notification message
            const savedNotification = await this.notificationService.create({
                orderId: order.id,
                recipientId: order.customer.id,
                title: notificationMassage.title,
                message: notificationMassage.body,
                type: notificationMassage.tag,
            });

            // Send notification to recipient
            await this.pushSubscriptionService.sendNotificationToUser(
                savedNotification.recipient.id,
                {
                    title: savedNotification.title,
                    body: savedNotification.message,
                    tag: savedNotification.type,
                    link: `/notifications`,
                },
            );
            const enrichedOrder = await this.enrichOrderWithAddress(order);

            return toOrderResponse(enrichedOrder);
        } catch (error) {
            this.logger.error(`Error canceling order: ${error.message}`);
            throw new InternalServerErrorException(error.message);
        }
    }

    /**
     * Gets an order by id for a customer
     * @param user - The user making the request
     * @param orderId - The id of the order to get
     * @returns The order response
     */
    async getOneByIdForCustomer(
        user: JwtPayload,
        orderId: string,
        accessToken: string,
    ): Promise<OrderResponse> {
        this.logger.debug(
            `OrderService.getOneByIdForCustomer(user: ${user.sub}) orderId: ${orderId}`,
        );
        // Get the order by id and customer id
        const order = await this.orderRepository.findOne({
            where: { id: orderId, customer: { id: user.sub } },
            relations: {
                technician: true,
                ac_units: true,
                customer: true,
                invoice: true,
            },
        });
        let ratingStatuses: Record<string, string> | undefined;
        if (order.status === OrderStatusEnum.COMPLETED) {
            ratingStatuses = await this.ratingService.getBatchStatus(
                [order.id],
                accessToken,
            );
        }

        const enrichedOrder = await this.enrichOrderWithAddress(order);

        // Return the order response
        return toOrderResponse(
            enrichedOrder,
            ratingStatuses?.[order.id] ?? null,
        );
    }

    /**
     * Gets a notification message based on the order status
     * @param status - The order status
     * @returns The notification message
     */
    private updateStatusNotificationMessage(
        userName: string,
        status: OrderStatusEnum,
    ): PayloadMessage {
        const tag: NotificationType = NotificationType.ORDER_STATUS_UPDATE;
        /**
         * The notification message based on the order status
         */
        switch (status) {
            case OrderStatusEnum.CONFIRMED:
                return {
                    title: `Pesanan Diterima! ✅`,
                    body: `Sip, teknisi udah terima. Tinggal tunggu hari-H aja, ya. Nanti dikabarin lagi.`,
                    tag,
                };
            case OrderStatusEnum.TECHNICIAN_ON_THE_WAY:
                return {
                    title: 'Teknisi Meluncur! 🛵',
                    body: `Berangkaaat! Teknisi lagi di jalan menuju lokasi. Siap-siap, ya!`,
                    tag,
                };
            case OrderStatusEnum.ON_WORKING:
                return {
                    title: 'Teknisi Sudah Sampai! 👋',
                    body: `Halo ${userName}, teknisi udah di lokasi dan lagi siap-siap buat ngerjain AC-nya. Sabar sebentar, ya.`,
                    tag,
                };
            case OrderStatusEnum.WAITING_PAYMENT:
                return {
                    title: 'Kerjaan Beres, Tagihan Siap! 📃',
                    body: `Tagihannya udah siap, yuk langsung dibayar.`,
                    tag,
                };
            case OrderStatusEnum.COMPLETED:
                return {
                    title: 'Hore, Servis Selesai! 🎉',
                    body: `AC-nya udah adem lagi, nih. Makasih banyak udah pakai jasa Herdi Jaya Service, ya!`,
                    tag,
                };
            case OrderStatusEnum.CANCELLED:
                return {
                    title: 'Yah, Pesanan Dibatalkan 🥲',
                    body: `Maaf banget, ${userName}. Karena satu dan lain hal, teknisi harus batalin pesanannya. Yuk, coba buat pesanan baru.`,
                    tag: NotificationType.CANCELLED_ORDER,
                };
            default:
                throw new Error(`Unknown status ${status}`);
        }
    }

    /**
     * Gets all orders that were completed in the last 3 months
     * @returns All completed orders in the last 3 months
     */
    async getAllOrdersCompletedInThreeMonths(): Promise<Order[]> {
        this.logger.debug(`OrderService.getAllOrdersCompletedIn3Months()`);

        // Create a date that is 3 months ago
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Find all orders that have a status of completed and were updated in the last 3 months
        const completedOrders = await this.orderRepository.find({
            where: {
                status: OrderStatusEnum.COMPLETED,
                updated_at: LessThanOrEqual(threeMonthsAgo),
            },
            relations: {
                customer: true,
                notifications: true,
            },
        });

        return completedOrders;
    }
}
