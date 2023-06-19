import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Sort } from '../../../../../../system/decorators/sort/sort.decorator';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../../../../system/enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../../../../system/enums/messages/deleted-messages/deleted-messages.enum';
import { PaginationMessage } from '../../../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { TextMessage } from '../../../../../../system/enums/messages/text-messages/text-messages.enum';
import {
  normalizePageSizeValue,
  normalizePageValue,
} from '../../../../../../system/utils/pagination/pagination-transformer';
import { textSearchTransformer } from '../../../../../../system/utils/text-seach/text-search-transformer';
import { UserOrder } from '../../../../../enums/sort/user-order/user-order.enum';

export class FindUserRequestDTO {
  /**
   * Textual query.
   *
   * @example "roduct 1"
   */
  @IsString({ message: TextMessage.STRING })
  @IsOptional()
  @Transform((options) => textSearchTransformer(options.value))
  @Expose()
  query?: string;

  /**
   * Active state filter. "active" by default.
   *
   * @example "all"
   */
  @IsEnum(ActiveFilter, { message: ActiveMessage.TYPE })
  @Transform((options) => {
    if (options.value == null) {
      return ActiveFilter.ACTIVE;
    } else if (options.value == ActiveFilter.ACTIVE) {
      return ActiveFilter.ACTIVE;
    } else if (options.value == ActiveFilter.INACTIVE) {
      return ActiveFilter.INACTIVE;
    } else if (options.value == ActiveFilter.ALL) {
      return ActiveFilter.ALL;
    }
    return options.value;
  })
  @Expose()
  active?: ActiveFilter;

  /**
   * Deleted state filter. "not_deleted" by default.
   *
   * @example "not_deleted"
   */
  @IsEnum(DeletedFilter, { message: DeletedMessage.INVALID })
  @Transform((options) => {
    if (options.value == null) {
      return DeletedFilter.NOT_DELETED;
    } else if (typeof options.value == 'string') {
      const value = options.value.toLowerCase();
    } else if (options.value == DeletedFilter.DELETED) {
      return DeletedFilter.DELETED;
    } else if (options.value == DeletedFilter.NOT_DELETED) {
      return DeletedFilter.NOT_DELETED;
    } else if (options.value == DeletedFilter.ALL) {
      return DeletedFilter.ALL;
    }
    return options.value;
  })
  @Expose()
  deleted?: DeletedFilter;

  /**
   * Page.
   * Integer greater or equal 1. 1 by default.
   *
   * @example 1
   */
  @IsInt({ message: PaginationMessage.PAGE_INT })
  @Transform((options) => normalizePageValue(options.obj.page))
  @Expose()
  page?: number;

  /**
   * Page size.
   * Integer from 1 up to 40.
   * 12 by default.
   *
   * @example 20
   */
  @IsInt({ message: PaginationMessage.PAGE_SIZE_INT })
  @Transform((options) => normalizePageSizeValue(options.obj.pageSize))
  @Expose()
  pageSize?: number;

  /**
   * Sort criteria. "name_asc" by default.
   *
   * @example "name_asc,active_desc"
   */
  @Sort(UserOrder, { defaultValues: [UserOrder.NAME_ASC] })
  orderBy?: UserOrder[];
}
