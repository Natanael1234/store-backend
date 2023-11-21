import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

const multipleParametersMessage =
  'Should receive only a single parameter called query';
const invalidMessage = 'Invalid JSON format for the "query" parameters';

@Injectable()
export class QueryParamToJsonInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // if (Object.keys(request.query).length != 1) {
    //   throw new BadRequestException(multipleParametersMessage);
    // }

    // Check if the query parameter is present and not empty
    if (!request.query.query) {
      request.query.query = {};
    } else {
      if (typeof request.query.query != 'string') {
        throw new BadRequestException(invalidMessage);
      }

      try {
        // Parse the "query" parameter from a string to JSON
        const parsedQuery = JSON.parse(request.query.query);
        // Replace the "query" parameter in the request object with the parsed JSON
        request.query.query = parsedQuery;
      } catch (error) {
        // Handle parsing errors if necessary
        throw new BadRequestException(invalidMessage);
      }
    }

    return next.handle();
  }
}
