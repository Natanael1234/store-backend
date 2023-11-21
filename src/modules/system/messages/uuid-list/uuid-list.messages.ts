import { IdConfigs } from '../../configs/id/id.configs';
import { UuidMessage } from '../uuid/uuid.messages';

const { MAX_ID } = IdConfigs;

export class UuidListMessage {
  NULL: string;
  REQUIRED: string;
  INVALID: string;
  MIN_LEN: string;
  MAX_LEN: string;

  ITEM_INVALID: string;
  ITEM_STRING: string;
  ITEM_NULL: string;
  ITEM_REQUIRED: string;

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
    const ItemMessage = new UuidMessage(label + ' item');

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
    this.ITEM_STRING = ItemMessage.STRING;
    this.ITEM_NULL = ItemMessage.NULL;
    this.ITEM_REQUIRED = ItemMessage.REQUIRED;
  }
}
