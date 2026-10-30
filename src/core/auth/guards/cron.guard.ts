import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { configuration } from '~/common/configuration';
import { RequestWithUser } from '~/common/utils';

@Injectable()
export class CronGuard implements CanActivate {
    private readonly logger: Logger = new Logger(CronGuard.name);
    /**
     * This guard is used to protect cron endpoints. It verifies
     * the authorization header to ensure that the request is coming
     * from the cron job.
     *
     * @param context The execution context.
     * @returns A boolean indicating whether the request is allowed or not.
     */
    async canActivate(context: ExecutionContext): Promise<boolean> {
        this.logger.debug('Verifying cron request...');
        const request: RequestWithUser = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        // Verify the authorization header
        if (authHeader !== `Bearer ${configuration().cron.secret}`) {
            this.logger.warn(`Authorization header is invalid.`);
            throw new UnauthorizedException();
        }

        this.logger.log('Cron request verified.');
        return true;
    }
}
