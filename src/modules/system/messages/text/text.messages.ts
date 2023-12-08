export class TextMessage {
  NULL: string;
  REQUIRED: string;
  INVALID: string;
  MIN_LEN: string;
  MAX_LEN: string;

  constructor(
    label: string,
    options?: {
      minLength?: number;
      maxLength?: number;
    },
  ) {
    let capitalizedLabel = label[0].toUpperCase() + label.slice(1);
    const minLength = options?.minLength;
    const maxLength = options?.maxLength;

    this.NULL = `Null ${label}`;
    this.REQUIRED = `${capitalizedLabel} is required`;
    this.INVALID = `Invalid ${label}`;
    if (!options?.minLength) {
      this.MIN_LEN = `${capitalizedLabel} too short`;
    } else {
      if (minLength < 2) {
        this.MIN_LEN = `${capitalizedLabel} should be at least ${minLength} character long`;
      } else {
        this.MIN_LEN = `${capitalizedLabel} should be at least ${minLength} characters long`;
      }
    }
    if (!options?.maxLength) {
      this.MAX_LEN = `${capitalizedLabel} too long`;
    } else {
      if (maxLength < 2) {
        this.MAX_LEN = `${capitalizedLabel} should have a maximum of ${maxLength} character`;
      } else {
        this.MAX_LEN = `${capitalizedLabel} should have a maximum of ${maxLength} characters`;
      }
    }
  }
}
