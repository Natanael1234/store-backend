import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { UuidMessage } from '../../messages/uuid/uuid.messages';
import { isValidUUID } from '../../utils/validation/uuid/is-valid-uuid-fn';

@Injectable()
export class UuidValidationPipe implements PipeTransform {
  constructor(private readonly label: string) {}

  transform(value: string, metadata: ArgumentMetadata): string {
    if (typeof value != 'string') {
      const Message = new UuidMessage(this.label);
      throw new BadRequestException(Message.STRING);
    }
    if (!isValidUUID(value)) {
      const Message = new UuidMessage(this.label);
      throw new BadRequestException(Message.INVALID);
    }
    return value;
  }
}
