import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '~/common/decorators/roles.decorator';
import { RoleEnum } from '~/common/enums/role.enum';

/**
 * Determines whether the current request should be allowed or not.
 *
 * It checks if the `ROLES_KEY` metadata is present in the current
 * handler or controller. If it is, it checks if the user's roles
 * include any of the required roles. If not, it throws a `403 Forbidden`
 * exception.
 *
 * @param context the execution context
 * @returns `true` if the request should be allowed, `false` otherwise
 *
 * @requires `JwtGuard` to get the user data
 * @see [Guards](https://docs.nestjs.com/guards#binding-guards)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleEnum[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.some((role) => user.role?.includes(role))) {
      throw new ForbiddenException('Not Allowed to perform action');
    }
    return true;
  }
}
