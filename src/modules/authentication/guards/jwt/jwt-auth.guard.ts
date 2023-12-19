import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../decorators/skip-authentication';

@Injectable()
export class JwtAuthenticationGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // TODO:
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.

    const isPublic = !!this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    context['isPublic'] = isPublic;
    // if (isPublic) {
    //   return true;
    // }
    return super.canActivate(context);
  }

  // TODO: verificar tipos
  handleRequest(
    error: any,
    user: any,
    info: Error,
    context: ExecutionContext,
    status?: any,
  ) {
    // TODO:
    // You can throw an exception based on either "info" or "err" arguments

    if (error || info || !user) {
      if (error) {
        throw error;
      } else if (info) {
        if (info.message == 'No auth token') {
          if (context['isPublic']) {
            return null;
          }
          throw new UnauthorizedException();
        }
        throw info;
      } else {
        throw new UnauthorizedException();
      }
    } else {
      return user;
    }
  }
}
