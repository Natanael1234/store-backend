import { NumberConfigs } from '../../configs/number/number.configs';

export class NumberMessage {
  INT: string;
  INVALID: string;
  MIN: string;
  MAX: string;
  NULL: string;
  REQUIRED: string;

  constructor(
    label: string,
    options?: {
      min?: number;
      max?: number;
    },
  ) {
    const min = options?.min ?? NumberConfigs.MIN_NUMBER;
    const max = options?.max ?? NumberConfigs.MAX_NUMBER;

    let capitalizedLabel = label[0].toUpperCase() + label.slice(1);

    this.NULL = `Null ${label}`;
    this.REQUIRED = `${capitalizedLabel} is required`;
    this.INVALID = `Invalid ${label}`;

    if (min == null) {
      this.MIN = `${capitalizedLabel} too low`;
    } else {
      this.MIN = `${capitalizedLabel} should be greater than or equal to ${min}`;
    }
    if (max == null) {
      this.MAX = `${capitalizedLabel} too high`;
    } else {
      this.MAX = `${capitalizedLabel} should be less than or equal to ${max}`;
    }

    this.INT = `${capitalizedLabel} must be integer`;
  }
}
