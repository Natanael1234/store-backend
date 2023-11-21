import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { IdConfigs } from '../../configs/id/id.configs';
import { IdMessage } from '../../messages/id/id.messages';

const { MIN_ID, MAX_ID } = IdConfigs;

function validate(label: string, value) {
  if (typeof value != 'number') {
    const Message = new IdMessage(label);
    throw new BadRequestException(Message.INVALID);
  } else if (!Number.isInteger(value)) {
    const Message = new IdMessage(label);
    throw new BadRequestException(Message.INT);
  } else if (value < MIN_ID) {
    const Message = new IdMessage(label);
    throw new BadRequestException(Message.MIN);
  } else if (value > MAX_ID) {
    const Message = new IdMessage(label);
    throw new BadRequestException(Message.MAX);
  }
  return value;
}

@Injectable()
export class IdParserPipe implements PipeTransform {
  constructor(private readonly label) {}

  transform(value: string, metadata: ArgumentMetadata): number {
    // const label = metadata.data || 'id';
    const label = this.label;
    if (typeof value == 'number') {
      return validate(label, value);
    } else if (typeof value == 'string') {
      const num = parseFloat(value);
      if (!isNaN(num) && isFinite(num)) {
        return validate(label, num);
      } else {
        return validate(label, value);
      }
    } else {
      return validate(label, value);
    }
  }
}
