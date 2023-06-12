import {
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
} from 'class-validator';
function getConstraint(options: {
  optional?: boolean;
  customPropertyName?: string;
  requiredMessage: string;
  notNullMessage: string;
  invalidTypeMessage: string;
}) {
  @ValidatorConstraint({ name: 'isForeignKey', async: false })
  class IsForeignKeyConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
      const { constraints } = args;
      const [allowUndefined, allowNull] = constraints;
      if (!allowNull && value === null) {
        return false;
      }
      if (!allowUndefined && value === undefined) {
        return false;
      }
      if (value === null || value === undefined) {
        return true;
      }
      if (!Number.isInteger(value)) {
        return false;
      }
      if (value < 1) {
        return false;
      }
      return true;
    }

    defaultMessage(args: ValidationArguments) {
      const { value, constraints } = args;
      const [allowUndefined, allowNull] = constraints;
      if (!allowUndefined && value === undefined) {
        return (
          options.requiredMessage ||
          `${options.customPropertyName || args.property} is required`
        );
      }

      if (!allowNull && value === null) {
        return (
          options.notNullMessage ||
          `${options.customPropertyName || args.property} is null`
        );
      }

      return (
        options.invalidTypeMessage ||
        `${options.customPropertyName || args.property} is invalid`
      );
    }
  }
  return IsForeignKeyConstraint;
}

export function IsForeignKey(
  validationOptions?: ValidationOptions & {
    allowUndefined?: boolean;
    allowNull?: boolean;
    customPropertyName?: string;
    requiredMessage?: string;
    notNullMessage?: string;
    invalidTypeMessage?: string;
  },
) {
  return function (object: Object, propertyName: string) {
    const {
      allowUndefined,
      allowNull,
      customPropertyName,
      requiredMessage,
      notNullMessage,
      invalidTypeMessage,
    } = validationOptions || {};
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [!!allowUndefined, !!allowNull],
      validator: getConstraint({
        customPropertyName,
        requiredMessage,
        notNullMessage,
        invalidTypeMessage,
      }),
    });
  };
}
