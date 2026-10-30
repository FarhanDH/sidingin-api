import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RequestWithUser } from '~/common/utils';
import { ApiResponse } from '~/common/api-response.dto';
import { UserResponse } from './dto/user.response';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @SkipThrottle()
    @UseGuards(JwtGuard)
    @Get('me')
    async getMe(
        @Request() request: RequestWithUser,
    ): Promise<ApiResponse<UserResponse>> {
        const data = await this.userService.getMe(request.user.sub);
        return {
            message: 'User fetched successfully',
            data,
        };
    }
}
