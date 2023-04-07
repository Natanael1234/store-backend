import {
  ValidationError,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';

export class ValidationPipe extends NestValidationPipe {
  public createExceptionFactory() {
    return (validationErrors: ValidationError[] = []) => {
      if (this.isDetailedOutputDisabled) {
        return new HttpErrorByCode[this.errorHttpStatusCode]();
      }

      const code = this.errorHttpStatusCode;
      const HttpError = new HttpErrorByCode[this.errorHttpStatusCode]();
      const error = {
        error: HttpError['name'],
        message: {},
        statusCode: code,
      };

      for (const validationError of validationErrors) {
        // validationError.constraints = {};
        error.message[validationError.property] = Object.values(
          validationError.constraints,
        )[0];
        // TODO: handler children
      }

      return new HttpErrorByCode[this.errorHttpStatusCode](error);
    };
  }
}
