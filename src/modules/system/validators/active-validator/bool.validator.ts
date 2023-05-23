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
  invalidTypeMessage: string;
}) {
  @ValidatorConstraint({ name: 'isBool', async: false })
  class IsBoolConstraint implements ValidatorConstraintInterface {
    validate(value: any, args: ValidationArguments) {
      const [optional] = args.constraints;

      if (optional && value === undefined) {
        return true;
      }

      if (value === true || value === false) {
        return true;
      }

      return false;
    }

    defaultMessage(args: ValidationArguments) {
      const [optional] = args.constraints;
      if ((!optional && args.value === undefined) || args.value === null) {
        return (
          options.requiredMessage ||
          `${options.customPropertyName || args.property} is required`
        );
      } else {
        return (
          options.invalidTypeMessage ||
          `${options.customPropertyName || args.property} is invalid`
        );
      }
    }
  }
  return IsBoolConstraint;
}

export function IsBool(
  validationOptions?: ValidationOptions & {
    optional?: boolean;
    customPropertyName?: string;
    requiredMessage?: string;
    invalidTypeMessage?: string;
  },
) {
  return function (object: Object, propertyName: string) {
    const {
      optional,
      customPropertyName,
      requiredMessage,
      invalidTypeMessage,
    } = validationOptions || {};
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [!!optional],
      validator: getConstraint({
        customPropertyName,
        requiredMessage,
        invalidTypeMessage,
      }),
    });
  };
}
