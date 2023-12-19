import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ImagesMetadataMessage } from '../../messages/images-metadata/images-metadata.messages.enum';

const multipleParametersMessage =
  'Should receive only a single parameter called metadas';
const invalidMessage = 'Invalid JSON format for the "metadata" parameters';

type RequestType = {
  body: { metadata?: { fileIdx?: number; file?: any }[] };
  files?: any[];
};

@Injectable()
export class ImageMetadataParserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    this.parseMetadata(request);
    this.validateMetadata(request.body.metadata);
    return next.handle();
  }

  private parseMetadata(request: RequestType) {
    // if (Object.keys(request.query).length != 1) {
    //   throw new BadRequestException(multipleParametersMessage);
    // }

    // Check if metadata parameter is present and not empty
    if (!request.body.metadata) {
      request.body.metadata = [];
    }
    // parse metadata from string o object
    else {
      if (typeof request.body.metadata != 'string') {
        throw new BadRequestException(invalidMessage);
      }
      try {
        // Parse the "metadata" parameter from a string to JSON
        const parsedMetadata = JSON.parse(request.body.metadata) ?? [];

        // Replace the "metadata" parameter in the request object with the parsed JSON
        request.body.metadata = parsedMetadata;
      } catch (error) {
        // Handle parsing errors if necessary
        throw new BadRequestException(invalidMessage);
      }
    }
  }

  private validateMetadata(metadata: any[]) {
    if (!metadata) {
      return;
    }
    if (!Array.isArray(metadata)) {
      throw new UnprocessableEntityException(
        ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      );
    }
  }
}
