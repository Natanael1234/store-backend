import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PaginationMessage } from '../../enums/messages/pagination-messages/pagination-messages.enum';
import { normalizePageValue } from '../../utils/pagination/pagination-transformer';

export function Page() {
  const decorators = applyDecorators(
    IsInt({ message: PaginationMessage.PAGE_INT }),
    Transform((options) => normalizePageValue(options.obj.page)),
    Expose(),
  );
  return decorators;
}
