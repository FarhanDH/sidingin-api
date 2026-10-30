import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Request,
    Res,
    UseGuards,
} from '@nestjs/common';
import { ApiResponse } from '~/common/api-response.dto';
import { Roles } from '~/common/decorators/roles.decorator';
import { RoleEnum } from '~/common/enums/role.enum';
import { RequestWithUser } from '~/common/utils';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateInvoiceDto } from './dto/invoice.request';
import { InvoiceResponseDto } from './dto/invoice.response';
import { Invoice } from './entities/invoice.entity';
import { InvoiceService } from './invoice.service';
import { Response } from 'express';

@Controller('invoices')
export class InvoiceController {
    constructor(private readonly invoiceService: InvoiceService) {}

    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.TECHNICIAN)
    @Post(':orderId')
    async create(
        @Param('orderId') orderId: string,
        @Body() createInvoiceDto: CreateInvoiceDto,
        // ): Promise<ApiResponse<InvoiceResponseDto>> {
    ) {
        const data = await this.invoiceService.create(
            orderId,
            createInvoiceDto,
        );
        return {
            message: 'Invoice created successfully and customer notified.',
            data,
        };
    }

    @UseGuards(JwtGuard)
    @Get(':invoiceId')
    async getById(
        @Request() request: RequestWithUser,
        @Param('invoiceId') invoiceId: string,
    ): Promise<ApiResponse<Invoice>> {
        const data = await this.invoiceService.getByIdWithUserId(
            invoiceId,
            request.user.sub,
        );
        return {
            message: 'Invoice retrieved successfully.',
            data,
        };
    }

    @Get(':id/download')
    @UseGuards(JwtGuard, RolesGuard)
    @Roles(RoleEnum.CUSTOMER)
    async downloadInvoice(
        @Param('id') invoiceId: string,
        @Request() req: RequestWithUser,
        @Res() res: Response,
    ) {
        const customerId = req.user.sub;
        const pdfBuffer = await this.invoiceService.generatePdf(
            invoiceId,
            customerId,
        );

        // Set HTTP headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=invoice-${invoiceId}.pdf`,
        );

        // Send the PDF buffer as the response
        res.send(pdfBuffer);
    }
}
