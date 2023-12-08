export class UuidMessage {
  readonly NULL;
  readonly REQUIRED: string;
  readonly INVALID: string;
  readonly STRING: string;

  constructor(label: string) {
    let capitalizedLabel = label[0].toUpperCase() + label.slice(1);
    this.NULL = `Null ${label}`;
    this.REQUIRED = `${capitalizedLabel} is required`;
    this.INVALID = `Invalid ${label}`;
    this.STRING = `${capitalizedLabel} must be string`;
  }
}
