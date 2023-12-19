import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { DeletedFilter } from '../../enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../messages/bool/bool.messages';
import { getEnumTransformer } from '../transformers/enum/enum-transformer';

const deletedEnumTransformer = getEnumTransformer(DeletedFilter, {
  defaultValue: DeletedFilter.NOT_DELETED,
});

export function Deleted(label: string) {
  const DeletedMessage = new BoolMessage(label);
  const decorators = applyDecorators(
    IsEnum(DeletedFilter, { message: DeletedMessage.INVALID }),
    Transform(({ value }) => deletedEnumTransformer(value)),
    Expose(),
  );
  return decorators;
}
