import { RoleEnum } from '~/common/enums/role.enum';
import { User } from '../entities/user.entity';

export class UserResponse {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string;
    phoneNumber: string;
    role: RoleEnum;
    createdAt: Date;
    updatedAt: Date;
    tokens?: AccessRefreshTokens;
}

export class AccessRefreshTokens {
    accessToken: string;
    expiresIn: number;
    refreshToken: string;
    refreshExpiresIn: number;
}

export const toUserResponse = (user: User): UserResponse => ({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    phoneNumber: user.phone_number,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
});
