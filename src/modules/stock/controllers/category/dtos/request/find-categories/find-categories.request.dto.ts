import { Expose, Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { Active } from '../../../../../../system/decorators/active/active.decorator';
import { Deleted } from '../../../../../../system/decorators/deleted/deleted.decorator';
import { IdList } from '../../../../../../system/decorators/id-list/id-list.decorator';
import { Sort } from '../../../../../../system/decorators/sort/sort.decorator';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { PaginationMessage } from '../../../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { TextMessage } from '../../../../../../system/enums/messages/text-messages/text-messages.enum';
import { getEnumTransformer } from '../../../../../../system/utils/enum/enum-transformer';
import {
  normalizePageSizeValue,
  normalizePageValue,
} from '../../../../../../system/utils/pagination/pagination-transformer';
import { textSearchTransformer } from '../../../../../../system/utils/text-seach/text-search-transformer';
import { CategoryMessage } from '../../../../../enums/messages/category-messages/category-messages.enum';
import { CategoryOrder } from '../../../../../enums/sort/category-order/category-order.enum';

const activeEnumTransformer = getEnumTransformer(ActiveFilter, {
  defaultValue: ActiveFilter.ACTIVE,
});

const deletedEnumTransformer = getEnumTransformer(DeletedFilter, {
  defaultValue: DeletedFilter.NOT_DELETED,
});

export class FindCategoriesRequestDTO {
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
  @Active()
  active?: ActiveFilter;

  /**
   * Deleted state filter. "not_deleted" by default.
   *
   * @example "not_deleted"
   */
  @Deleted()
  deleted?: DeletedFilter;

  /**
   * Parent category ids filter.
   *
   * @example "1,null"
   */
  @IdList({
    invalidMessage: CategoryMessage.INVALID_PARENT_CATEGORY_ID_LIST,
    invalidItemMessage: CategoryMessage.INVALID_PARENT_CATEGORY_ID_LIST_ITEM,
    requiredItemMessage: CategoryMessage.NULL_PARENT_CATEGORY_ID_LIST_ITEM,
    allowUndefined: true,
    allowNull: true,
    allowNullItem: true,
  })
  parentIds?: number[];

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
   * Integer from 1 up to 40. 12 by default.
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
  @Sort(CategoryOrder, { defaultValues: [CategoryOrder.NAME_ASC] })
  orderBy?: CategoryOrder[];
}
