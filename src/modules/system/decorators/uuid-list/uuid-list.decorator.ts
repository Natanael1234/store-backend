import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { IdListConfigs } from '../../configs/id-list/id-list.configs';
import { UuidListMessage } from '../../messages/uuid-list/uuid-list.messages';
import { isValidUUID } from '../../utils/validation/is-valid-uuid-fn';

export type IsUuidListConstrantOptions = ValidationOptions & {
  label: string;
  allowUndefined?: boolean;
  allowNull?: boolean;
  allowNullItem?: boolean;
  minLength?: number;
  maxLength?: number;
};

function getConstraints(options: IsUuidListConstrantOptions) {
  const label = options.label;
  const allowUndefined = !!options.allowUndefined;
  const allowNull = !!options.allowNull;
  const allowNullItem = !!options.allowNullItem;
  const minLength = options.minLength;
  const maxLength = options.maxLength || IdListConfigs.MAX_LENGTH;

  const Message = new UuidListMessage(label, {
    minLength: minLength,
    maxLength: maxLength,
  });

  @ValidatorConstraint({ name: 'isUuidList', async: false })
  class IsUuidListConstraint implements ValidatorConstraintInterface {
    validate(idList: number[], args: ValidationArguments) {
      if (this.isInvalidNull(idList)) {
        return false;
      }
      if (this.isInvalidUndefined(idList)) {
        return false;
      }
      if (this.isInvalidType(idList)) {
        return false;
      }
      if (this.isInvalidMinLength(idList)) {
        return false;
      }
      if (this.isInvalidMaxLength(idList)) {
        return false;
      }
      if (this.hasInvalidItem(idList)) {
        return false;
      }

      return true;
    }

    defaultMessage(args: ValidationArguments) {
      const idList: number[] = args.value;
      if (this.isInvalidNull(idList)) {
        return Message.NULL;
      }
      if (this.isInvalidUndefined(idList)) {
        return Message.REQUIRED;
      }
      if (this.isInvalidType(idList)) {
        return Message.INVALID;
      }
      if (this.isInvalidMinLength(idList)) {
        return Message.MIN_LEN;
      }
      if (this.isInvalidMaxLength(idList)) {
        return Message.MAX_LEN;
      }
      if (this.hasInvalidItem(idList)) {
        return Message.ITEM_INVALID;
      }
      return Message.INVALID;
    }

    private isInvalidType(arr: any[]) {
      return this.isInvalidNull(arr) || (arr != null && !Array.isArray(arr));
    }

    private isInvalidNull(arr: any[]) {
      return !allowNull && arr === null;
    }

    private isInvalidUndefined(arr: any[]) {
      return !allowUndefined && arr === undefined;
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

    private isInvalidItem(item: any) {
      if (item === null && allowNullItem) {
        return false;
      }
      return !isValidUUID(item);
    }

    private isInvalidMinLength(item: any) {
      if (Array.isArray(item) && minLength != null) {
        return item.length < minLength;
      }
      return false;
    }

    private isInvalidMaxLength(item: any) {
      if (Array.isArray(item) && maxLength != null) {
        return item.length > maxLength;
      }
      return false;
    }
  }

  return IsUuidListConstraint;
}

export function IsUuidList(validationOptions?: IsUuidListConstrantOptions) {
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

export const UuidList = (params?: IsUuidListConstrantOptions) => {
  const decorators = applyDecorators(
    IsUuidList(params),
    Transform(({ value }) => {
      if (value == null) {
        return value;
      }
      if (Array.isArray(value)) {
        return [...new Set(value)];
      }
      return value;
    }),
    Expose(),
  );

  return decorators;
};
