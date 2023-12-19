import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PaginationMessage } from '../../messages/pagination/pagination.messages.enum';
import { normalizePageValue } from './transformers/pagination/pagination-transformer';

export function Page() {
  const decorators = applyDecorators(
    // TODO: talvez não esteja usando a mensagem pois não ocorre mais erro
    IsInt({ message: PaginationMessage.PAGE_INVALID }),
    Transform((options) => normalizePageValue(options.obj.page)),
    Expose(),
  );
  return decorators;
}
