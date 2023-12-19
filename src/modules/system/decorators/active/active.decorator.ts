import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { ActiveFilter } from '../../enums/filter/active-filter/active-filter.enum';
import { BoolMessage } from '../../messages/bool/bool.messages';
import { getEnumTransformer } from '../transformers/enum/enum-transformer';

const activeEnumTransformer = getEnumTransformer(ActiveFilter, {
  defaultValue: ActiveFilter.ACTIVE,
});

export function Active(label: string) {
  const ActiveMessage = new BoolMessage(label);
  const decorators = applyDecorators(
    IsEnum(ActiveFilter, { message: ActiveMessage.INVALID }),
    Transform(({ value }) => activeEnumTransformer(value)),
    Expose(),
  );

  return decorators;
}
