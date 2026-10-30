import { RoleEnum } from '~/common/enums/role.enum';
import { UserResponse } from '~/core/user/dto/user.response';

export class JwtPayload {
    sub: string;
    fullName: string;
    iss: string;
    role: RoleEnum;
}

export class VerifyOtpResponse {
    user?: UserResponse;
    isNewUser: boolean;
}
