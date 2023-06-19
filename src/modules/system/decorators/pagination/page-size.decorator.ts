import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PaginationMessage } from '../../enums/messages/pagination-messages/pagination-messages.enum';
import { normalizePageSizeValue } from '../../utils/pagination/pagination-transformer';

export function PageSize() {
  const decorators = applyDecorators(
    IsInt({ message: PaginationMessage.PAGE_SIZE_INT }),
    Transform((options) => normalizePageSizeValue(options.obj.pageSize)),
    Expose(),
  );
  return decorators;
}
