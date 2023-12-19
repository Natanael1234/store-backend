import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsSorting, isValidSort } from './validators/sort/sort.validator';

export function Sort<Enum extends Record<string, string | number>>(
  Enumeration: Enum,
  params?: { defaultValues?: Enum[keyof Enum][] },
) {
  const defaultValues = params?.defaultValues || null;

  const decorators = applyDecorators(
    IsSorting(Enumeration),
    Transform(({ value: orderBy }) => {
      if (orderBy == null) {
        return defaultValues || orderBy;
      } else if (!isValidSort(Enumeration, orderBy)) {
        return defaultValues || orderBy;
      }
      if (!orderBy?.length) {
        return defaultValues || orderBy;
      }
      return orderBy;
    }),
    Expose(),
  );

  return decorators;
}
