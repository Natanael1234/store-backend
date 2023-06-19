import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { DeletedFilter } from '../../enums/filter/deleted-filter/deleted-filter.enum';
import { DeletedMessage } from '../../enums/messages/deleted-messages/deleted-messages.enum';
import { getEnumTransformer } from '../../utils/enum/enum-transformer';

const deletedEnumTransformer = getEnumTransformer(DeletedFilter, {
  defaultValue: DeletedFilter.NOT_DELETED,
});

export function Deleted() {
  const decorators = applyDecorators(
    IsEnum(DeletedFilter, { message: DeletedMessage.INVALID }),
    Transform(({ value }) => deletedEnumTransformer(value)),
    Expose(),
  );
  return decorators;
}
