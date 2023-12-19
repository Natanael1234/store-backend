import { applyDecorators } from '@nestjs/common';
import { Expose } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { BoolMessage } from '../../messages/bool/bool.messages';

export type IsBoolConstrantOptions = ValidationOptions & {
  label: string;
  allowUndefined?: boolean;
  allowNull?: boolean;
};

function getConstraints(options: IsBoolConstrantOptions) {
  let label = options?.label;
  const allowNull = !!options?.allowNull;
  const allowUndefined = !!options?.allowUndefined;
  const Messages = new BoolMessage(label);

  @ValidatorConstraint({ name: 'isBool', async: false })
  class IsBoolConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
      if (!allowNull && value === null) {
        return false;
      }
      if (!allowUndefined && value === undefined) {
        return false;
      }
      if (value != null && typeof value != 'boolean') {
        return false;
      }
      return true;
    }

    defaultMessage(args: ValidationArguments) {
      if (!allowNull && args.value === null) {
        return Messages.NULL;
      }
      if (!allowUndefined && args.value === undefined) {
        return Messages.REQUIRED;
      }
      if (args.value != null && typeof args.value != 'boolean') {
        return Messages.INVALID;
      }
      return Messages.INVALID;
    }
  }

  return IsBoolConstraint;
}

function IsBool(validationOptions?: IsBoolConstrantOptions) {
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

export function Bool(options?: IsBoolConstrantOptions) {
  const decorators = applyDecorators(IsBool(options), Expose());
  return decorators;
}
