import { applyDecorators } from '@nestjs/common';
import { Expose } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { NumberMessage } from '../../messages/number/number.messages';

export type IsNumConstrantOptions = ValidationOptions & {
  label: string;
  allowUndefined?: boolean;
  allowNull?: boolean;
  min?: number;
  max?: number;
  onlyInt?: boolean;
};

function getConstraints(options: IsNumConstrantOptions) {
  let label = options?.label;
  const allowNull = !!options?.allowNull;
  const allowUndefined = !!options?.allowUndefined;
  const min = options?.min;
  const max = options?.max;
  const onlyInt = !!options.onlyInt;

  const Messages = new NumberMessage(label, { min, max });

  @ValidatorConstraint({ name: 'isNum', async: false })
  class IsNumConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
      if (!allowNull && value === null) {
        return false;
      } else if (!allowUndefined && value === undefined) {
        return false;
      } else if (value == null || value == undefined) {
        return true;
      } else if (typeof value !== 'number') {
        return false;
      } else if (isNaN(value)) {
        return false;
      } else if (onlyInt && !Number.isInteger(value)) {
        return false;
      } else if (min != null && value < min) {
        return false;
      } else if (max != null && value > max) {
        return false;
      }
      return true;
    }

    defaultMessage(args: ValidationArguments) {
      const value = args.value;
      if (!allowNull && value === null) {
        return Messages.NULL;
      } else if (!allowUndefined && value === undefined) {
        return Messages.REQUIRED;
      } else if (value == null || value == undefined) {
        return;
      } else if (typeof value != 'number') {
        return Messages.INVALID;
      } else if (isNaN(value)) {
        return Messages.INVALID;
      } else if (onlyInt && !Number.isInteger(value)) {
        return Messages.INT;
      } else if (min != null && value < min) {
        return Messages.MIN;
      } else if (max != null && value > max) {
        return Messages.MAX;
      }
      return Messages.INVALID;
    }
  }

  return IsNumConstraint;
}

function IsNum(validationOptions?: IsNumConstrantOptions) {
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

export function Num(options?: IsNumConstrantOptions) {
  const decorators = applyDecorators(IsNum(options), Expose());
  return decorators;
}
