import { Expose, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PaginationMessage } from '../../../enums/messages/pagination-messages/pagination-messages.enum';
import {
  normalizePageSizeValue,
  normalizePageValue,
  normalizePaginationSkip,
  normalizePaginationTake,
} from '../../../utils/pagination/pagination-transformer';

export class PaginationRequestDTO {
  @IsInt({ message: PaginationMessage.PAGE_INT })
  @Transform((options) => normalizePageValue(options.obj.page))
  @Expose()
  page?: number;

  @IsInt({ message: PaginationMessage.PAGE_SIZE_INT })
  @Transform((options) => normalizePageSizeValue(options.obj.pageSize))
  @Expose()
  pageSize?: number;

  @Transform(({ obj: { page, pageSize } }) =>
    normalizePaginationSkip(page, pageSize),
  )
  @Expose()
  skip?: number;

  @Transform(({ obj: { pageSize } }) => normalizePaginationTake(pageSize))
  @Expose()
  take?: number;
}
