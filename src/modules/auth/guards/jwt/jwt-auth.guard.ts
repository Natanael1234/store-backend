import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { CachingService } from 'src/modules/system/caching/services/caching.service';
import { IS_PUBLIC_KEY } from '../skip-auth';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(context: ExecutionContext) {
    // TODO:
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  // TODO: verificar tipos
  handleRequest(err, user, info: Error) {
    // TODO:
    // You can throw an exception based on either "info" or "err" arguments
    if (err || info || !user) {
      throw err || info || new UnauthorizedException();
    }

    return user;
  }
}
