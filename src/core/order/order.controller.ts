import {
    Body,
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '~/common/api-response.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { OrderStatusEnum } from '~/common/enums/order-status.enum';
import { RoleEnum } from '~/common/enums/role.enum';
import { RequestWithUser } from '~/common/utils';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
    CancelOrderRequestDto,
    CreateOrderRequestDto,
    UpdateOrderStatusRequestDto,
} from './dto/order.request';
import { OrderResponse } from './dto/order.response';
import { OrderService } from './order.service';
import { OrderDateFilter } from '~/common/enums/order-date.enum';
import { InvoiceResponseDto } from '../invoice/dto/invoice.response';
import { Throttle } from '@nestjs/throttler';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    @Post()
    async createForCustomer(
        @Request() request: RequestWithUser,
        @Body() createOrderDto: CreateOrderRequestDto,
        // ): Promise<ApiResponse<OrderResponse>> {
    ) {
        const data = await this.orderService.createForCustomer(
            request.user,
            createOrderDto,
        );
        return {
            message: 'Order created successfully',
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    @Get()
    async getAllForCustomer(
        @Request() request: RequestWithUser,
        @Query('status')
        status?: OrderStatusEnum | 'progress',
        @Query('countOnly') countOnly?: boolean,
    ): Promise<ApiResponse<OrderResponse[]>> {
        const data = await this.orderService.getAllForCustomer(
            request.user,
            status,
            countOnly,
            request.cookies['accessToken'],
        );
        return {
            message: 'Orders fetched successfully',
            data,
        };
    }

    // @UseGuards(JwtGuard, RolesGuard)
    // @Roles(RoleEnum.TECHNICIAN)
    // @Get('/technician/:date')
    // async getAllByDate(
    //     @Request() request: RequestWithUser,
    //     @Query('date')
    //     date?: Date,
    // ) {
    //     const data = await this.orderService.getAllByDate(date);
    //     return {
    //         message: `Orders by date ${date} fetched successfully`,
    //         data,
    //     };
    // }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.TECHNICIAN)
    /**
     * Fetches orders for the authenticated technician based on various filters.
     * @param request - The request object with the authenticated user.
     * @param serviceDate - The service date filter.
     * @param countOnly - If true, returns only the counts of orders.
     * @param status - Filters orders by status ('completed', 'cancelled', 'missed').
     * @param period - The time period to consider for the date filter ('daily', 'weekly', 'monthly').
     * @returns A promise that resolves to an API response containing an array of orders or order counts.
     * @throws {@link NotFoundException} if the order with the given ID is not found.
     * @throws {@link BadRequestException} if the request is invalid.
     * @throws {@link InternalServerErrorException} if an error occurs while fetching the orders.
     */
    @Throttle({ default: { limit: 50, ttl: 60000 } })
    @Get('technician')
    async getAllForTechnician(
        @Request() request: RequestWithUser,
        @Query('service-date') serviceDate: OrderDateFilter | Date,
        @Query('countOnly') countOnly?: boolean,
        @Query('status') status?: 'completed' | 'cancelled' | 'missed',
        @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    ): Promise<ApiResponse<OrderResponse[]>> {
        const data = await this.orderService.getAllForTechnician(
            request.user,
            serviceDate,
            status,
            countOnly,
            period,
        );
        return {
            message: 'Orders fetched successfully',
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.TECHNICIAN)
    @Get('technician/:id')
    async getOneByIdForTechnician(
        @Request() request: RequestWithUser,
        @Param('id') id: string,
    ): Promise<ApiResponse<OrderResponse>> {
        const data = await this.orderService.getOneByIdForTechnician(
            request.user,
            id,
        );
        return {
            message: 'Order fetched successfully',
            data,
        };
    }

    @UseGuards(JwtGuard)
    @Get(':id/invoice')
    async getInvoiceByOrderId(
        @Param('id') id: string,
    ): Promise<ApiResponse<InvoiceResponseDto>> {
        const data = await this.orderService.getInvoiceByOrderId(id);
        return {
            message: `Invoice by order id ${id} fetched successfully`,
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.TECHNICIAN)
    @Patch(':id/status')
    async updateStatusByIdForTechnician(
        @Request() request: any,
        @Param('id') id: string,
        @Body() updateOrderStatusDto: UpdateOrderStatusRequestDto,
    ): Promise<ApiResponse<OrderResponse>> {
        const data = await this.orderService.updateStatusByIdForTechnician(
            request.user,
            id,
            updateOrderStatusDto,
        );
        return {
            message: 'Order status updated successfully',
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.TECHNICIAN)
    @Patch('technician/:id/cancel')
    async cancelByIdForTechnician(
        @Request() request: RequestWithUser,
        @Param('id') id: string,
        @Body() cancelOrderDto: CancelOrderRequestDto,
    ): Promise<ApiResponse<OrderResponse>> {
        const data = await this.orderService.cancelByIdForTechnician(
            request.user,
            id,
            cancelOrderDto,
        );
        return {
            message: 'Order canceled successfully',
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    @Patch(':id/cancel')
    async cancelByIdForCustomer(
        @Request() request: RequestWithUser,
        @Param('id') id: string,
        @Body() cancelOrderDto: CancelOrderRequestDto,
    ): Promise<ApiResponse<OrderResponse>> {
        const data = await this.orderService.cancelByIdForCustomer(
            request.user,
            id,
            cancelOrderDto,
        );
        return {
            message: 'Order canceled successfully',
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    @Get(':id')
    async getOneByIdForCustomer(
        @Request() request: RequestWithUser,
        @Param('id') id: string,
    ): Promise<ApiResponse<OrderResponse>> {
        const data = await this.orderService.getOneByIdForCustomer(
            request.user,
            id,
            request.cookies['accessToken'],
        );
        return {
            message: 'Order fetched successfully',
            data,
        };
    }
}
