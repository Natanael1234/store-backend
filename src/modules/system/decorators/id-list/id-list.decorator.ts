import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import {
  IsIdList,
  IsIdListConstrantOptions,
} from '../../validators/id-list-validator/id-list.validator';

export const IdList = (params?: IsIdListConstrantOptions) => {
  const decorators = applyDecorators(
    IsIdList(params),
    Transform(({ value }) => {
      if (value === null) {
        return null;
      }
      if (value === undefined || value === '') {
        return undefined;
      }

      if (typeof value == 'string') {
        const arr = value.split(',').map((e) => {
          if (e == 'null') {
            return null;
          }
          const num = Number(e);
          if (!isNaN(num)) {
            return num;
          }
          return e;
        });

        return [...new Set(arr)];
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
