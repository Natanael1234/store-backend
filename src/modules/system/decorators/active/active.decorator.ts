import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { ActiveFilter } from '../../enums/filter/active-filter/active-filter.enum';
import { ActiveMessage } from '../../enums/messages/active-messages/active-messages.enum';
import { getEnumTransformer } from '../../utils/enum/enum-transformer';

const activeEnumTransformer = getEnumTransformer(ActiveFilter, {
  defaultValue: ActiveFilter.ACTIVE,
});

export function Active() {
  const decorators = applyDecorators(
    IsEnum(ActiveFilter, { message: ActiveMessage.INVALID }),
    Transform(({ value }) => activeEnumTransformer(value)),
    Expose(),
  );

  return decorators;
}
