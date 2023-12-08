import { applyDecorators } from '@nestjs/common';
import { Expose } from 'class-transformer';
import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
import { TextMessage } from '../../messages/text/text.messages';

export type IsTextConstrantOptions = ValidationOptions & {
  label: string;
  allowUndefined?: boolean;
  allowNull?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: 'email' | 'phone';
};

function getConstraints(options: IsTextConstrantOptions) {
  let label = options?.label;
  const allowNull = !!options?.allowNull;
  const allowUndefined = !!options?.allowUndefined;
  const minLength = options?.minLength || 0;
  const maxLength = options?.maxLength;
  const Messages = new TextMessage(label, { minLength, maxLength });
  const pattern = options?.pattern;

  @ValidatorConstraint({ name: 'isText', async: false })
  class IsTextConstraint implements ValidatorConstraintInterface {
    validate(value: any[], args: ValidationArguments) {
      if (this.isInvalidNull(value)) {
        return false;
      }
      if (this.isInvalidUndefined(value)) {
        return false;
      }
      if (this.hasInvalidType(value)) {
        return false;
      }
      if (this.hasInvalidMinLength(value)) {
        return false;
      }
      if (this.hasInvalidMaxLength(value)) {
        return false;
      }
      if (this.hasInvalidPattern(value)) {
        return false;
      }
      return true;
    }

    defaultMessage(args: ValidationArguments) {
      const value = args.value;
      if (this.isInvalidNull(value)) {
        return Messages.NULL;
      }
      if (this.isInvalidUndefined(value)) {
        return Messages.REQUIRED;
      }
      if (this.hasInvalidType(value)) {
        return Messages.INVALID;
      }
      if (this.hasInvalidMinLength(value)) {
        return Messages.MIN_LEN;
      }
      if (this.hasInvalidMaxLength(value)) {
        return Messages.MAX_LEN;
      }
      if (this.hasInvalidPattern(value)) {
        return Messages.INVALID;
      }
    }

    /**
     * Checks if has invalid type.
     * @param val value.
     * @returns true if invalid. False if valid.
     */
    private hasInvalidType(val: any) {
      return val != null && typeof val != 'string';
    }

    /**
     * Checks if value is invalid null when null is not allowed.
     * @param val value
     * @returns true if invalid. False if valid.
     */
    private isInvalidNull(val: any) {
      return !allowNull && val === null;
    }

    /**
     * Checks if value is invalid undefined when undefined is not allowed.
     * @param val value.
     * @returns true if invalid. False if valid.
     */
    private isInvalidUndefined(val: any) {
      return !allowUndefined && val === undefined;
    }

    /**
     * Checks if value is shorter than allowed when value is string and minimum length option is defined.
     * @param val value.
     * @returns true if invalid. False if valid.
     */
    private hasInvalidMinLength(value: any) {
      if (minLength && typeof value == 'string') {
        return value.length < minLength;
      }
      return false;
    }

    /**
     * Checks if value is longer than allowed when value is string and minimum length option is defined.
     * @param val value.
     * @returns true if invalid. False if valid.
     */
    private hasInvalidMaxLength(value: any) {
      if (maxLength != null && typeof value == 'string') {
        return value.length > maxLength;
      }
      return false;
    }

    /**
     * Check if value doesn't matches the pattern when value is string and the pattern is defined.
     * @param val value.
     * @returns true if invalid. False if valid.
     */
    private hasInvalidPattern(value: any) {
      if (pattern && typeof value == 'string') {
        if (pattern == 'email') {
          const regexp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return !regexp.test(value);
        } else if (pattern == 'phone') {
          const regexp = /^(\+\d{2}\s?)?(\(\d{2}\)\s?)?(\d{4,5}-\d{4})$/;
          return !regexp.test(value);
        }
      }
      return false;
    }
  }

  return IsTextConstraint;
}

function IsText(validationOptions?: IsTextConstrantOptions) {
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

export function Text(options?: IsTextConstrantOptions) {
  const decorators = applyDecorators(IsText(options), Expose());
  return decorators;
}
