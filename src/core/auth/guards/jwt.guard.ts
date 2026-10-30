import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { configuration } from '~/common/configuration';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}
    private readonly logger: Logger = new Logger(JwtGuard.name);
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const token = request.cookies['accessToken'];
        if (!token) {
            this.logger.warn('No token provided');
            throw new UnauthorizedException();
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: configuration().jwtConstants.secretAccessToken,
                algorithms: ['HS256'],
                audience: ['sidingin-api'],
                issuer: configuration().jwtConstants.issuer,
            });
            // 💡 We're assigning the payload to the request object here
            // so that we can access it in our route handlers
            request['user'] = payload;
        } catch (error) {
            this.logger.error(error.message);
            throw new UnauthorizedException(error.message);
        }
        return true;
    }
}
