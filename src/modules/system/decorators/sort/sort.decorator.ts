import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsSorting } from '../../validators/sort-validator/sort.validator';

function removeDuplicated(arr: any[]) {
  return [...new Set(arr)];
}

export function Sort<Enum extends Record<string, string | number>>(
  enumValue: Enum,
  params?: { defaultValues?: Enum[keyof Enum][] },
) {
  const defaultValues = params?.defaultValues
    ? removeDuplicated(params.defaultValues)
    : null;

  const decorators = applyDecorators(
    IsSorting(enumValue),
    Transform(({ value }) => {
      if (value === null) {
        if (defaultValues) {
          return defaultValues;
        }
        return null;
      }
      if (value === undefined || value === '') {
        if (defaultValues) {
          return defaultValues;
        }
        return undefined;
      }

      if (typeof value == 'string') {
        return removeDuplicated(value.split(','));
      }

      if (Array.isArray(value)) {
        if (!value.length && defaultValues) {
          return defaultValues;
        }
        return removeDuplicated(value);
      }

      return value;
    }),
    Expose(),
  );

  return decorators;
}
