import { Active } from '../../../../system/decorators/active/active.decorator';
import { Deleted } from '../../../../system/decorators/deleted/deleted.decorator';
import { PageSize } from '../../../../system/decorators/pagination/page-size.decorator';
import { Page } from '../../../../system/decorators/pagination/page.decorator';
import { Sort } from '../../../../system/decorators/sort/sort.decorator';
import { TextQuery } from '../../../../system/decorators/text-query/text-query.decorator';
import { UuidList } from '../../../../system/decorators/uuid-list/uuid-list.decorator';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { CategoryConfigs } from '../../configs/category/category.configs';
import { CategoryOrder } from '../../enums/category-order/category-order.enum';

export class FindCategoriesRequestDTO {
  /**
   * Textual query.
   *
   * @example "Category 1"
   */
  @TextQuery()
  textQuery?: string;

  /**
   * Active state filter. "active" by default.
   *
   * @example "all"
   */
  @Active('active')
  active?: ActiveFilter;

  /**
   * Deleted state filter. "not_deleted" by default.
   *
   * @example "not_deleted"
   */
  @Deleted('deleted')
  deleted?: DeletedFilter;

  /**
   * Parent category ids filter.
   *
   * @example "['f136f640-90b7-11ed-a2a0-fd911f8f7f38']"
   */
  @UuidList({
    label: 'parent ids',
    allowUndefined: true,
    allowNull: true,
    allowNullItem: true,
    maxLength: CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH,
  })
  parentIds?: string[];

  /**
   * Page.
   * Integer greater or equal 1. 1 by default.
   *
   * @example 1
   */
  @Page()
  page?: number;

  /**
   * Page size.
   * Integer from 1 up to 40. 12 by default.
   *
   * @example 20
   */
  @PageSize()
  pageSize?: number;

  /**
   * Sort criteria. ["name_asc, active_asc"] by default.
   *
   * @example "['name_asc', 'active_desc']"
   */
  @Sort(CategoryOrder, {
    defaultValues: CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY,
  })
  orderBy?: CategoryOrder[];
}
