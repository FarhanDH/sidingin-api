import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '~/common/api-response.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { RoleEnum } from '~/common/enums/role.enum';
import { RequestWithUser } from '~/common/utils';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OrderResponse } from '../order/dto/order.response';
import { CreateCoreApiPaymentRequestDto } from './dto/payment.request';
import { MidtransTokenResponse } from './dto/payment.response';
import { PaymentService } from './payment.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('payments')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}

    /**
     * Endpoint for a customer to initiate a payment via Midtrans.
     * Returns a Snap token for the frontend.
     */
    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    @Post('/invoices/:invoiceId/midtrans')
    async createMidtransPayment(
        @Param('invoiceId') invoiceId: string,
        @Request() req: RequestWithUser,
    ): Promise<ApiResponse<MidtransTokenResponse>> {
        const customerId = req.user.sub;
        const data = await this.paymentService.createSnapMidtransTransaction(
            invoiceId,
            customerId,
        );
        return {
            message: 'Midtrans transaction initiated successfully.',
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.TECHNICIAN)
    @Post('/invoices/:invoiceId/confirm-cash-payment')
    async confirmCashPayment(
        @Param('invoiceId') invoiceId: string,
        @Request() req: RequestWithUser,
    ): Promise<ApiResponse<OrderResponse>> {
        const data = await this.paymentService.confirmCashPayment(
            invoiceId,
            req.user,
        );

        return {
            message: 'Cash payment confirmed successfully.',
            data,
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    @Post('invoices/:invoiceId/core-api')
    async createCoreApiTransaction(
        @Param('invoiceId') invoiceId: string,
        @Request() req: RequestWithUser,
        @Body() dto: CreateCoreApiPaymentRequestDto,
    ) {
        const data = await this.paymentService.createCoreApiTransaction(
            invoiceId,
            req.user.sub,
            dto,
        );

        return {
            message: 'Core API transaction created successfully',
            data: {
                paymentId: data.id,
            },
        };
    }

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    @Get(':id')
    async getPaymentDetails(
        @Param('id') paymentId: string,
        @Request() req: RequestWithUser,
    ) {
        const data = await this.paymentService.getPaymentDetails(
            paymentId,
            req.user.sub,
        );
        return {
            message: 'Payment details fetched successfully',
            data,
        };
    }

    /**
     * Public endpoint to receive webhook notifications from Midtrans.
     * No authentication guards are used here as the request comes from Midtrans servers.
     * Security is handled by verifying the notification signature.
     */
    @SkipThrottle()
    @Post('midtrans-webhook')
    @HttpCode(HttpStatus.OK)
    async handleMidtransWebhook(@Body() body: any) {
        // We don't need to return anything in the response body.
        // The service handles all logic asynchronously.
        return await this.paymentService.handleMidtransWebhook(body);
    }
}
