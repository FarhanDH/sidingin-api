import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import { AuthService } from '../auth/auth.service';
import { OtpRequest } from '../auth/dto/auth.request';

@Injectable()
export class EmailService {
    constructor(
        private readonly mailerService: MailerService,
        private readonly authService: AuthService,
    ) {}

    private readonly logger = new Logger(EmailService.name);

    /**
     * Sends an OTP to the given email address.
     *
     * @param request - The request body containing the email to which the OTP should be sent.
     * @returns A promise that resolves with a message indicating whether the OTP was sent successfully or not.
     */
    async sendOtp(request: OtpRequest) {
        try {
            // First, ask the AuthService to send an OTP to the given email address.
            // The AuthService will generate a random OTP, store it in the database,
            // and return the OTP and email address of the user.
            const otp = await this.authService.sendOtp(request);

            // Then, ask the MailerService to send an email to the given email address.
            // The email should contain the OTP and some instructions on how to use it.
            const result = await this.mailerService.sendMail({
                // The email address to which the OTP should be sent.
                to: otp.email,

                // The subject of the email.
                subject: `Kode OTP Anda dari Cdingin (Jangan dibagikan!)`,

                // The template to be used to render the email.
                // The template should contain a variable called 'otpValue' which
                // should be replaced with the actual OTP.
                template: 'otp',

                // The data to be sent to the template engine to be used to render the email.
                context: {
                    // The OTP itself.
                    otpValue: otp.otp,

                    // How long the OTP is valid for.
                    expiresAt: otp.expiresAt,
                },
            });

            // If the email was sent successfully, return a message indicating success.
            return {
                message: 'OTP sent successfully',
                result,
            };
        } catch (error) {
            // If there was an error sending the email, log the error and throw a new Error.
            this.logger.error('Failed to send OTP', error.stack);
            throw new Error('Failed to send OTP');
        }
    }
}
