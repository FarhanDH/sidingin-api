import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerProfileRequest } from './dto/user.request';
import { User } from './entities/user.entity';
import { toUserResponse, UserResponse } from './dto/user.response';
import { RoleEnum } from '~/common/enums/role.enum';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}
    private readonly logger = new Logger(UserService.name);

    /**
     * Completes the profile of a customer after initial registration.
     * This method sets the full name, phone number, and avatar for a user.
     * It ensures that the phone number is not already in use by another user.
     *
     * @param request - The profile data to be saved.
     * @returns The updated user entity.
     * @throws {NotFoundException} If the user with the given email is not found.
     * @throws {ConflictException} If the phone number is already associated with another account.
     */
    /**
     * Completes the profile of a customer after initial registration.
     * This method sets the full name, phone number, and avatar for a user.
     * It ensures that the phone number is not already in use by another user.
     *
     * @param request - The profile data to be saved.
     * @returns The updated user entity.
     * @throws {NotFoundException} If the user with the given email is not found.
     * @throws {ConflictException} If the phone number is already associated with another account.
     */
    async registerCustomerProfile(
        request: CreateCustomerProfileRequest,
    ): Promise<User> {
        this.logger.debug(
            `Attempting to register customer profile for email: ${request.email}`,
        );

        // Normalize phone number by removing leading '0'
        let phoneNumber = request.phoneNumber;
        if (phoneNumber.startsWith('0')) {
            phoneNumber = phoneNumber.substring(1);
        }
        console.log(phoneNumber);

        const user = await this.userRepository.findOne({
            where: { email: request.email },
        });

        if (!user) {
            this.logger.warn(`User with email ${request.email} not found.`);
            throw new NotFoundException('Hmm, emailmu belum terdaftar');
        }

        // Check if the phone number is already in use by another user
        const existingUserWithPhone = await this.userRepository.findOne({
            where: { phone_number: phoneNumber },
        });

        if (existingUserWithPhone && existingUserWithPhone.id !== user.id) {
            this.logger.warn(
                `Phone number ${phoneNumber} is already in use by another user.`,
            );
            throw new ConflictException(
                'Nomor HP sudah terdaftar, silakan gunakan nomor HP lain.',
            );
        }

        user.full_name = request.fullName;
        user.phone_number = phoneNumber;
        user.avatar_url = `https://ui-avatars.com/api/?background=057895&color=fff&rounded=true&size=128&length=2&bold=true&font-size=0.33&name=${request.fullName}`;
        user.is_profile_completed = true;

        await this.userRepository.save(user);

        this.logger.debug(
            `Successfully completed profile for user ID: ${user.id}`,
        );

        return user;
    }

    async getByEmail(email: string): Promise<User> {
        return this.userRepository.findOne({ where: { email } });
    }

    async getById(id: string): Promise<User> {
        return await this.userRepository.findOne({ where: { id } });
    }

    async getAllTechnicians(): Promise<User[]> {
        return await this.userRepository.find({
            where: { role: RoleEnum.TECHNICIAN },
        });
    }

    async getMe(id: string): Promise<UserResponse> {
        const data = await this.getById(id);
        return toUserResponse(data);
    }

    async insertEmail(email: string): Promise<User> {
        const user = this.userRepository.create({ email });
        return this.userRepository.save(user);
    }

    createEmailEntity(email: string): User {
        return this.userRepository.create({ email });
    }
}
