import { Body, Controller, Options, Post } from '@nestjs/common';
import { ApiResponse } from '~/common/api-response.dto';
import { OtpRequest } from '../auth/dto/auth.request';
import { EmailService } from './email.service';
import { Throttle } from '@nestjs/throttler';

@Controller('email')
export class EmailController {
    constructor(private readonly emailService: EmailService) {}

    @Options('send-otp')
    optionsHandler() {
        // Handle preflight request for CORS
        return {
            message: 'CORS preflight request handled',
        };
    }

    @Throttle({ default: { limit: 3, ttl: 60000 } }) // Only can sent otp 3 times in one minute
    @Post('send-otp')
    /**
     * Handles the HTTP POST request to send an OTP to the given email address.
     *
     * @param request - The request body containing the email to which the OTP should be sent.
     * @returns A promise that resolves when the OTP has been successfully sent.
     */
    async sendOtp(@Body() request: OtpRequest): Promise<ApiResponse<string>> {
        const result = await this.emailService.sendOtp(request);

        return {
            message: result.message,
        };
    }
}
