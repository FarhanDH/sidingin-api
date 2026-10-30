import {
    Body,
    Controller,
    Delete,
    Logger,
    Post,
    Req,
    Res,
    UseGuards,
} from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { ApiResponse } from '~/common/api-response.dto';
import { configuration } from '~/common/configuration';
import { RequestWithUser } from '~/common/utils';
import { CreatePushSubscriptionRequest } from '../push-subscription/dto/push-subscription.request';
import { CreateCustomerProfileRequest } from '../user/dto/user.request';
import { AuthService } from './auth.service';
import { VerifyOtpRequest } from './dto/auth.request';
import { VerifyOtpResponse } from './dto/auth.response';
import { JwtGuard } from './guards/jwt.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}
    private readonly logger: Logger = new Logger(AuthController.name);

    private setTokenCookies(
        response: Response,
        tokens: { accessToken: string; refreshToken: string },
    ) {
        const isProduction = configuration().env === 'production';

        const cookieOptions: CookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            path: '/',
        };

        // if (!isProduction) {
        //     cookieOptions.domain = '.localhost';
        // } else if (configuration().domain) {
        //     cookieOptions.domain = configuration().domain;
        // }

        response.cookie('accessToken', tokens.accessToken, {
            ...cookieOptions,
            maxAge: configuration().jwtConstants.accessTokenExpiresIn * 1000,
        });
        response.cookie('refreshToken', tokens.refreshToken, {
            ...cookieOptions,
            maxAge: configuration().jwtConstants.refreshTokenExpiresIn * 1000,
        });
    }

    @Throttle({ default: { limit: 5, ttl: 60000 } }) // Only can sent otp 5 times in one minute
    @Post('verify-otp')
    async verifyOtp(
        @Body() request: VerifyOtpRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<ApiResponse<VerifyOtpResponse>> {
        const data = await this.authService.verifyOtp(request);

        if (data.user?.tokens) {
            this.setTokenCookies(response, data.user.tokens);
            data.user.tokens = undefined;
        }

        return {
            message: 'OTP verified successfully',
            data,
        };
    }

    @Post('register-customer-profile')
    async createCustomerProfile(
        @Body() request: CreateCustomerProfileRequest,
        @Res({ passthrough: true }) response: Response,
    ) {
        const data = await this.authService.registerCustomerProfile(request);

        this.setTokenCookies(response, data.tokens);
        data.tokens = undefined;

        return {
            message: 'Customer profile created successfully',
            data,
        };
    }

    @UseGuards(JwtGuard)
    @Delete('logout')
    async logout(
        @Req() request: RequestWithUser,
        @Body() subscription: CreatePushSubscriptionRequest,
        @Res({ passthrough: true }) response: Response,
    ) {
        this.logger.debug(
            `AuthController.logout(${JSON.stringify({ userId: request.user.sub })})`,
        );

        await this.authService.logout(subscription);
        response.clearCookie('accessToken');
        response.clearCookie('refreshToken');

        return {
            message: 'Logout successful',
        };
    }
}
