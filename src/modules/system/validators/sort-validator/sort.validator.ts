import { ValidationArguments } from 'class-validator';

import { ValidationOptions, registerDecorator } from 'class-validator';
import { SortMessage } from '../../enums/messages/sort-messages/sort-messages.enum';

// TODO: realmente é necessário?
export function IsSorting<T>(
  Enumeration: T,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSorting',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [Enumeration],
      options: validationOptions,
      validator: {
        validate(orderBy: any[], args: ValidationArguments) {
          if (!orderBy) false;
          if (!Array.isArray(orderBy)) return false;
          if (!orderBy.length) return true;
          const allowedOrderValues = Object.values(Enumeration);
          for (let orderByValue of orderBy) {
            if (!allowedOrderValues.includes(orderByValue)) {
              return false;
            }
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return SortMessage.INVALID;
        },
      },
    });
  };
}
