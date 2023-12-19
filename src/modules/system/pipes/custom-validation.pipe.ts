import {
  ValidationPipe as NestValidationPipe,
  ValidationError,
} from '@nestjs/common';
import { HttpErrorByCode } from '@nestjs/common/utils/http-error-by-code.util';
import { convertValidationErrorsToMessage } from '../utils/validation/validation';

export class ValidationPipe extends NestValidationPipe {
  public createExceptionFactory() {
    return (validationErrors: ValidationError[] = []) => {
      super.createExceptionFactory();
      if (this.isDetailedOutputDisabled) {
        return new HttpErrorByCode[this.errorHttpStatusCode]();
      }

      const code = this.errorHttpStatusCode;
      const HttpError = new HttpErrorByCode[this.errorHttpStatusCode]();

      const error = {
        error: HttpError['name'],
        message: convertValidationErrorsToMessage(validationErrors),
        statusCode: code,
      };

      const httpError = new HttpErrorByCode[this.errorHttpStatusCode](error);
      return httpError;
    };
  }
}
