import { applyDecorators } from '@nestjs/common';
import { Expose } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { IdConfigs } from '../../configs/id/id.configs';
import { IdMessage } from '../../messages/id/id.messages';

const { MAX_ID, MIN_ID } = IdConfigs;

export type IsIdConstrantOptions = ValidationOptions & {
  label: string;
  allowUndefined?: boolean;
  allowNull?: boolean;
};

function getConstraints(options: IsIdConstrantOptions) {
  let label = options?.label;
  const allowNull = !!options?.allowNull;
  const allowUndefined = !!options?.allowUndefined;
  const min = MIN_ID;
  const max = MAX_ID;

  const Messages = new IdMessage(label);

  @ValidatorConstraint({ name: 'isId', async: false })
  class IsIdConstraint implements ValidatorConstraintInterface {
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
      } else if (!Number.isInteger(value)) {
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
      } else if (!Number.isInteger(value)) {
        return Messages.INT;
      } else if (min != null && value < min) {
        return Messages.MIN;
      } else if (max != null && value > max) {
        return Messages.MAX;
      }
      return Messages.INVALID;
    }
  }

  return IsIdConstraint;
}

function IsId(validationOptions?: IsIdConstrantOptions) {
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

function transform(val: any) {
  if (typeof val == 'string') {
    const num = parseFloat(val);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
    return val;
  } else if (Number.isInteger(val)) {
    return val;
  }
  return val;
}

export function Id(options?: IsIdConstrantOptions) {
  const decorators = applyDecorators(
    IsId(options),
    // Transform(({ value: id }) => (options.allowString ? transform(id) : id)),
    Expose(),
  );
  return decorators;
}
