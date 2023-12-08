import { IdConfigs } from '../../configs/id/id.configs';
import { IdMessage } from '../id/id.messages';

const { MAX_ID } = IdConfigs;

export class IdListMessage {
  NULL: string;
  REQUIRED: string;
  REQUIRED_ITEM: string; // TODO: repetido?
  INVALID: string;
  MIN_LEN: string;
  MAX_LEN: string;
  ITEM_INVALID: string;
  ITEM_INT: string;
  ITEM_NULL: string;
  ITEM_REQUIRED: string; // TODO: repetido?
  ITEM_MIN: string;
  ITEM_MAX: string;

  constructor(
    label: string,
    options?: {
      minLength?: number;
      maxLength?: number;
    },
  ) {
    let capitalizedLabel = label[0].toUpperCase() + label.slice(1);
    const minLength = options?.minLength ?? 0;
    const maxLength = options?.maxLength ?? MAX_ID;
    const ItemMessage = new IdMessage(label + ' item');

    this.NULL = `Null ${label}`;
    this.REQUIRED = `${capitalizedLabel} is required`;
    this.INVALID = `Invalid ${label}`;

    if (minLength < 2) {
      this.MIN_LEN = `${capitalizedLabel} should be at least ${minLength} item long`;
    } else {
      this.MIN_LEN = `${capitalizedLabel} should be at least ${minLength} items long`;
    }
    if (maxLength < 2) {
      this.MAX_LEN = `${capitalizedLabel} should have a maximum of ${maxLength} item`;
    } else {
      this.MAX_LEN = `${capitalizedLabel} should have a maximum of ${maxLength} items`;
    }

    this.ITEM_INVALID = ItemMessage.INVALID;
    this.ITEM_INT = ItemMessage.INT;
    this.ITEM_NULL = ItemMessage.NULL;
    this.ITEM_REQUIRED = ItemMessage.REQUIRED;
    this.ITEM_MIN = ItemMessage.MIN;
    this.ITEM_MAX = ItemMessage.MAX;
  }
}
