import { ValidationArguments } from 'class-validator';

import { registerDecorator } from 'class-validator';
import { SortMessage } from '../../enums/messages/sort-messages/sort-messages.enum';

export function IsSorting<T>(Enumeration: T) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSorting',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [Enumeration],
      options: {},
      validator: {
        validate(orderBy: any[], args: ValidationArguments) {
          if (orderBy == null) {
            return true;
          } else if (!Array.isArray(orderBy)) {
            return false;
          }
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
