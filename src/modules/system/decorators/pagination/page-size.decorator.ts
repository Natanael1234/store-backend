import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PaginationMessage } from '../../messages/pagination/pagination.messages.enum';
import { normalizePageSizeValue } from './transformers/pagination/pagination-transformer';

export function PageSize() {
  const decorators = applyDecorators(
    IsInt({ message: PaginationMessage.PAGE_SIZE_INVALID }),
    Transform((options) => normalizePageSizeValue(options.obj.pageSize)),
    Expose(),
  );
  return decorators;
}
