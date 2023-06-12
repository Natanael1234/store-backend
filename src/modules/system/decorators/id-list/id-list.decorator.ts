import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { getJSONTransformer } from '../../utils/json/json-transformer';
import {
  IsIdList,
  IsIdListConstrantOptions,
} from '../../validators/id-list-validator/id-list.validator';

const jsonTransformer = getJSONTransformer({});

export const IdList = (params?: IsIdListConstrantOptions) => {
  const decorators = applyDecorators(
    IsIdList(params),
    Transform((options) => jsonTransformer(options.value)),
  );

  return decorators;
};
