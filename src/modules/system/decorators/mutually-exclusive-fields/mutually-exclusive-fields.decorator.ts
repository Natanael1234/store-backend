import { applyDecorators } from '@nestjs/common';
import { Expose } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';

import { MutuallyExclusiveFieldsMessage } from '../../messages/mutually-exclusive-fields/mutually-exclusive-fields.messages';

export type MutuallyExclusiveFieldsConstrantOptions = ValidationOptions & {
  sourceField: string;
  targetField: string;
};

function getConstraints(options: MutuallyExclusiveFieldsConstrantOptions) {
  const Message = new MutuallyExclusiveFieldsMessage(
    options.sourceField,
    options.targetField,
  );

  @ValidatorConstraint({ name: 'isMutuallyExclusive', async: false })
  class IsBoolConstraint implements ValidatorConstraintInterface {
    validate(sourceValue: any, args: ValidationArguments) {
      const targetValue = args.object[options.targetField];
      if (sourceValue != null && targetValue != null) {
        return false;
      }
      if (sourceValue == null && targetValue == null) {
        return false;
      }
      return true;
    }

    defaultMessage(args: ValidationArguments) {
      const sourceValue = args.value;
      const targetValue = args.object[options.targetField];
      if (sourceValue != null && targetValue != null) {
        return Message.BOTH_DEFINED;
      }
      if (sourceValue == null && targetValue == null) {
        return Message.NONE_DEFINED;
      }
    }
  }

  return IsBoolConstraint;
}

function IsMutuallyExclusiveFields(
  validationOptions?: MutuallyExclusiveFieldsConstrantOptions,
) {
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

export function MutuallyExclusiveFields(
  options: MutuallyExclusiveFieldsConstrantOptions,
) {
  const decorators = applyDecorators(
    IsMutuallyExclusiveFields(options),
    Expose(),
  );
  return decorators;
}
