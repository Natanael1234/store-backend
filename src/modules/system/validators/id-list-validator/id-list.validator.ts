import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

export type IsIdListConstrantOptions = ValidationOptions & {
  customPropertyName?: string;

  requiredMessage?: string;
  notNullMessage?: string;
  invalidMessage?: string;

  invalidItemMessage?: string;
  requiredItemMessage?: string;

  allowUndefined?: boolean;
  allowNull?: boolean;
  allowNullItem?: boolean;
};

function getConstraints(options: IsIdListConstrantOptions) {
  @ValidatorConstraint({ name: 'isIdList', async: false })
  class IsIdListConstraint implements ValidatorConstraintInterface {
    validate(arr: any[], args: ValidationArguments) {
      if (this.isInvalidNull(arr)) {
        return false;
      }
      if (this.isInvalidUndefined(arr)) {
        return false;
      }
      if (this.isInvalidType(arr)) {
        return false;
      }
      if (this.hasInvalidNullItem(arr)) {
        return false;
      }
      if (this.hasInvalidItem(arr)) {
        return false;
      }
      return true;
    }

    defaultMessage(args: ValidationArguments) {
      if (this.isInvalidNull(args.value)) {
        return this.getInvalidNullMessage(args.property);
      }
      if (this.isInvalidUndefined(args.value)) {
        return this.getInvalidUndefinedMessage(args.property);
      }
      if (this.isInvalidType(args.value)) {
        return this.getInvalidTypeMessage(args.property);
      }
      if (this.hasInvalidNullItem(args.value)) {
        return this.getInvalidNullItemMessage(args.property);
      }
      if (this.hasInvalidItem(args.value)) {
        return this.getInvalidItemMessage(args.property);
      }
      return this.getInvalidTypeMessage(args.property);
    }

    private isInvalidType(arr: any[]) {
      return this.isInvalidNull(arr) || (arr != null && !Array.isArray(arr));
    }

    private getInvalidTypeMessage(property: string) {
      return (
        options?.invalidMessage ||
        `Invalid ${options?.customPropertyName || property}`
      );
    }

    private getInvalidNullMessage(property: string) {
      return (
        options?.notNullMessage ||
        `Null ${options?.customPropertyName || property}`
      );
    }

    private getInvalidUndefinedMessage(property: string) {
      return (
        options?.requiredMessage ||
        `${options?.customPropertyName || property} is required`
      );
    }

    private getInvalidNullItemMessage(property: string) {
      return (
        options?.requiredItemMessage ||
        `${options?.customPropertyName || property} items cannot be null`
      );
    }

    private getInvalidItemMessage(property: string) {
      return (
        options?.invalidItemMessage ||
        `Invalid ${options?.customPropertyName || property} item`
      );
    }

    private isInvalidNull(arr: any[]) {
      return !options?.allowNull && arr === null;
    }

    private isInvalidUndefined(arr: any[]) {
      return !options?.allowUndefined && arr === undefined;
    }

    private hasInvalidItem(arr: any[]) {
      if (!Array.isArray(arr)) {
        return false;
      }
      for (const item of arr) {
        if (this.isInvalidItem(item)) {
          return true;
        }
      }
      return false;
    }

    private hasInvalidNullItem(arr: any[]): boolean {
      if (!Array.isArray(arr)) {
        return false;
      }
      for (const item of arr) {
        if (this.isInvalidNullItem(item)) {
          return true;
        }
      }
      return false;
    }

    private isInvalidItem(item: any) {
      if (item === null) {
        return this.isInvalidNullItem(item);
      } else {
        return !Number.isInteger(item) || item < 1;
      }
    }

    private isInvalidNullItem(item: any) {
      return item === null && !options?.allowNullItem;
    }
  }

  return IsIdListConstraint;
}

export function IsIdList(validationOptions?: IsIdListConstrantOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions || {},
      constraints: [],
      validator: getConstraints(validationOptions),
    });
  };
}
