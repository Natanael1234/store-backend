import { IdConfigs } from '../../configs/id/id.configs';
import { NumberMessage } from '../number/number.messages';

const { MIN_ID, MAX_ID } = IdConfigs;

export class IdMessage extends NumberMessage {
  NULL: string;
  REQUIRED: string;
  INVALID: string;
  MIN: string;
  MAX: string;
  INT: string;

  constructor(label: string) {
    super(label, { min: MIN_ID, max: MAX_ID });
  }
}
