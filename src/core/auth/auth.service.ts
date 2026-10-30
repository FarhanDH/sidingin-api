import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { configuration } from '~/common/configuration';
import { CreatePushSubscriptionRequest } from '../push-subscription/dto/push-subscription.request';
import { PushSubscriptionService } from '../push-subscription/push-subscription.service';
import { CreateCustomerProfileRequest } from '../user/dto/user.request';
import { toUserResponse, UserResponse } from '../user/dto/user.response';
import { User } from '../user/entities/user.entity';
import { UserService } from '../user/user.service';
import { OtpRequest, VerifyOtpRequest } from './dto/auth.request';
import { VerifyOtpResponse } from './dto/auth.response';
import { OtpToken } from './entities/otp-token.entity';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(OtpToken)
        private readonly otpTokenRepository: Repository<OtpToken>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly pushSubscriptionService: PushSubscriptionService,
    ) {}

    private readonly logger = new Logger(AuthService.name);

    /**
     * Sends an OTP to the given email address.
     *
     * @param request - The request body containing the email to which the OTP should be sent.
     * @returns A promise that resolves when the OTP has been successfully sent.
     */
    async sendOtp(request: OtpRequest) {
        this.logger.debug(`AuthService.sendOtp: ${JSON.stringify(request)}`);

        // Make sure that the changes to the database are atomic, so create a query runner and start a transaction.
        const connection = this.otpTokenRepository.manager.connection;
        const queryRunner = connection.createQueryRunner();

        // Connect to the database.
        await queryRunner.connect();

        // Start a transaction. Ensure that all the changes to the database are atomic, either all the changes are made or none of them are made.
        await queryRunner.startTransaction();

        try {
            // Get the user with the given email address. If the user does not exist, create a new user.
            let user = await this.userService.getByEmail(request.email);

            if (!user) {
                user = await queryRunner.manager.save(
                    this.userService.createEmailEntity(request.email),
                );
            }

            // Make the old OTP tokens invalid.
            await this.otpTokenRepository.update(
                {
                    user: { id: user.id },
                    is_used: false,
                    expires_at: MoreThan(new Date()),
                },
                {
                    is_used: true,
                },
            );

            // Generate a random OTP.
            const otp = this.generateOtp();

            // Create an OTP token entity with the given OTP, expiration time, and user.
            const otpToken = this.otpTokenRepository.create({
                otpCode: otp,
                expires_at: new Date(Date.now() + 5 * 60 * 1000),
                user,
            });

            // Save the OTP token to the database.
            await queryRunner.manager.save(otpToken);

            // Commit the transaction. This will make all the changes we made to the database permanent.
            await queryRunner.commitTransaction();

            // Return the OTP, email, and expiration time to the caller.
            return {
                otp: otpToken.otpCode,
                email: otpToken.user.email,
                expiresAt: 5,
            };
        } catch (error) {
            // If an error occurs, rollback the transaction. This will undo all the
            // changes made to the database.
            await queryRunner.rollbackTransaction();

            // Log the error.
            this.logger.error('Failed to send OTP', error.stack);

            // Throw an error to the caller.
            throw new Error('Failed to send OTP');
        } finally {
            // Release the query runner. This is important because it will free up any
            // resources that the query runner is using.
            await queryRunner.release();
        }
    }

    /**
     * Verifies an OTP that was sent to the user's email address.
     *
     * @param request - The request body containing the email and OTP to verify.
     * @returns A promise that resolves with an object containing the user data and a boolean indicating whether the user is new or existing.
     * @throws UnauthorizedException if the OTP is invalid, expired, or has already been used.
     */
    async verifyOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        // Log the incoming OTP verification request for debugging purposes.
        this.logger.debug(`AuthService.verifyOtp: ${JSON.stringify(request)}`);

        // Attempt to find an OTP token associated with the given email and OTP code.
        // Ensure that the OTP has not expired by checking the expiration date.
        const otpToken = await this.otpTokenRepository.findOne({
            relations: ['user'], // Include user data in the result.
            where: {
                user: { email: request.email }, // Look for a user with the specified email.
                otpCode: request.otp, // Look for the specified OTP code.
                expires_at: MoreThan(new Date()), // Ensure the OTP has not expired.
            },
        });

        // If no OTP token is found or the OTP has already been used or expired, log a warning and throw an error.
        if (!otpToken || otpToken.is_used || otpToken.expires_at < new Date()) {
            this.logger.warn(
                `Failed OTP verification for email: ${request.email}`,
            );
            throw new UnauthorizedException('OTP salah atau sudah kedaluwarsa');
        }

        // Mark the found OTP as used to prevent reuse.
        await this.markOtpAsUsed(otpToken.user);

        // Generate JWT tokens for the user.
        const tokens = await this.generateJwtTokens(otpToken.user);

        // Determine if the user is new or existing and return appropriate response.
        // If the user's profile is completed, return the user data and mark isNewUser as false.
        // Otherwise, mark isNewUser as true.
        return otpToken.user.is_profile_completed
            ? {
                  isNewUser: false,
                  user: { ...toUserResponse(otpToken.user), tokens },
              }
            : { isNewUser: true };
    }

    async registerCustomerProfile(
        request: CreateCustomerProfileRequest,
    ): Promise<UserResponse> {
        const user = await this.userService.registerCustomerProfile(request);
        // Generate JWT tokens for the user.
        const tokens = await this.generateJwtTokens(user);

        return { ...toUserResponse(user), tokens };
    }

    async logout(
        subscriptionDto: CreatePushSubscriptionRequest,
    ): Promise<{ message: string }> {
        console.log(subscriptionDto);
        // remove subscription data
        return await this.pushSubscriptionService.deleteByEndpoint(
            subscriptionDto.endpoint,
        );
    }

    private async generateJwtTokens(
        user: User,
    ): Promise<UserResponse['tokens']> {
        const jwt = configuration().jwtConstants;

        const jwtPayload = {
            fullName: user.full_name,
            role: user.role,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(jwtPayload, {
                subject: user.id,
                issuer: jwt.issuer,
                algorithm: 'HS256',
                audience: ['sidingin-api', 'rating-service'],
                expiresIn: `${configuration().jwtConstants.accessTokenExpiresIn}s`,
                secret: configuration().jwtConstants.secretAccessToken,
            }),
            this.jwtService.signAsync(jwtPayload, {
                subject: user.id,
                issuer: jwt.issuer,
                jwtid: randomUUID(),
                algorithm: 'HS256',
                audience: ['sidingin-refresh'],
                expiresIn: `${configuration().jwtConstants.refreshTokenExpiresIn}s`,
                secret: configuration().jwtConstants.secretRefreshToken,
            }),
        ]);

        return {
            accessToken,
            expiresIn: configuration().jwtConstants.accessTokenExpiresIn,
            refreshToken,
            refreshExpiresIn:
                configuration().jwtConstants.refreshTokenExpiresIn,
        };
    }

    async markOtpAsUsed(user: User) {
        return await this.otpTokenRepository.update(
            {
                user: { id: user.id },
                is_used: false,
                expires_at: MoreThan(new Date()),
            },
            {
                is_used: true,
            },
        );
    }

    generateOtp() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }
}
