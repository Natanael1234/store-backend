export class MutuallyExclusiveFieldsMessage {
  BOTH_DEFINED: string;
  NONE_DEFINED: string;

  constructor(sourceField: string, targetField: string) {
    this.BOTH_DEFINED = `Both ${sourceField} and ${targetField} defined`;
    this.NONE_DEFINED = `Field ${sourceField} or field ${targetField} should be defined`;
  }
}
