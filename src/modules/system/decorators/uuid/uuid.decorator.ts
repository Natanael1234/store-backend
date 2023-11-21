import { applyDecorators } from '@nestjs/common';
import { Expose } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { UuidMessage } from '../../messages/uuid/uuid.messages';
import { isValidUUID } from '../../utils/validation/is-valid-uuid-fn';

export type IsUuidConstrantOptions = ValidationOptions & {
  label: string;
  allowUndefined?: boolean;
  allowNull?: boolean;
};

function getConstraints(options: IsUuidConstrantOptions) {
  let label = options?.label;
  const allowNull = !!options?.allowNull;
  const allowUndefined = !!options?.allowUndefined;

  const Messages = new UuidMessage(label);

  @ValidatorConstraint({ name: 'isUuid', async: false })
  class IsUuidConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
      if (!allowNull && value === null) {
        return false;
      } else if (!allowUndefined && value === undefined) {
        return false;
      } else if (value == null || value == undefined) {
        return true;
      }
      return isValidUUID(value);
    }

    defaultMessage(args: ValidationArguments) {
      const value = args.value;
      if (!allowNull && value === null) {
        return Messages.NULL;
      } else if (!allowUndefined && value === undefined) {
        return Messages.REQUIRED;
      } else if (value == null || value == undefined) {
        return;
      } else if (typeof value == 'string') {
        return Messages.INVALID;
      }
      return Messages.STRING;
    }
  }

  return IsUuidConstraint;
}

function IsUuid(validationOptions?: IsUuidConstrantOptions) {
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

export function Uuid(options?: IsUuidConstrantOptions) {
  const decorators = applyDecorators(IsUuid(options), Expose());
  return decorators;
}
