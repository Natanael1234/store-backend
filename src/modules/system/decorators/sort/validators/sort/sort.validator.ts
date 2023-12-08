import { ValidationArguments } from 'class-validator';

import { registerDecorator } from 'class-validator';
import { SortMessage } from '../../../../messages/sort/sort.messages.enum';

function containsInvalidSortItem<T>(Enumeration: T, orderBy: any[]) {
  if (Array.isArray(orderBy)) {
    const allowedOrderValues = Object.values(Enumeration);
    for (let orderByValue of orderBy) {
      if (!allowedOrderValues.includes(orderByValue)) {
        return true;
      }
    }
  }
  return false;
}

function containRepeatedSortItems<T>(items: any[]) {
  if (Array.isArray(items)) {
    const fields = {};
    for (const item of items) {
      const [column, direction] = item.split('_');
      if (fields[column] === true) {
        return true;
      }
      fields[column] = true;
    }
  }
  return false;
}

function isValidSortArray<T>(Enumeration: T, orderBy: any[]) {
  if (orderBy == null) {
    return true;
  }
  if (!Array.isArray(orderBy)) {
    return false;
  }
  if (containsInvalidSortItem(Enumeration, orderBy)) {
    return false;
  }
  return true;
}

function getSortErrorMessage<T>(Enumeration: T, orderBy: any[]) {
  if (!isValidSortArray(Enumeration, orderBy)) {
    return SortMessage.INVALID;
  } else if (containRepeatedSortItems(orderBy)) {
    return SortMessage.REPEATED;
  }
}

export function isValidSort<T>(Enumeration: T, orderBy: any[]) {
  return (
    isValidSortArray(Enumeration, orderBy) && !containRepeatedSortItems(orderBy)
  );
}

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
          return isValidSort(Enumeration, orderBy);
        },
        defaultMessage(args: ValidationArguments) {
          return getSortErrorMessage(Enumeration, args.value);
        },
      },
    });
  };
}
