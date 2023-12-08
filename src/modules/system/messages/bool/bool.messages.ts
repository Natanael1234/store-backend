export class BoolMessage {
  NULL: string;
  REQUIRED: string;
  INVALID: string;

  constructor(label: string) {
    let capitalizedLabel = label[0].toUpperCase() + label.slice(1);

    this.NULL = `Null ${label}`;
    this.REQUIRED = `${capitalizedLabel} is required`;
    this.INVALID = `Invalid ${label}`;
  }
}
