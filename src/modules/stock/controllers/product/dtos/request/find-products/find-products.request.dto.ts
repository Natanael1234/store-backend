import { Active } from '../../../../../../system/decorators/active/active.decorator';
import { Deleted } from '../../../../../../system/decorators/deleted/deleted.decorator';
import { IdList } from '../../../../../../system/decorators/id-list/id-list.decorator';
import { PageSize } from '../../../../../../system/decorators/pagination/page-size.decorator';
import { Page } from '../../../../../../system/decorators/pagination/page.decorator';
import { Sort } from '../../../../../../system/decorators/sort/sort.decorator';
import { TextQuery } from '../../../../../../system/decorators/text-query/text-query.decorator';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BrandMessage } from '../../../../../enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../../../../../enums/messages/category-messages/category-messages.enum';
import { ProductOrder } from '../../../../../enums/sort/product-order/product-order.enum';

export class FindProductRequestDTO {
  /**
   * Textual query.
   *
   * @example "roduct 1"
   */
  @TextQuery()
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
   * Brands ids filter.
   *
   * @example 1,null"
   */
  @IdList({
    invalidMessage: BrandMessage.INVALID_BRAND_ID_LIST,
    invalidItemMessage: BrandMessage.INVALID_BRAND_ID_LIST_ITEM,
    requiredItemMessage: BrandMessage.NULL_BRAND_ID_LIST_ITEM,
    allowUndefined: true,
    allowNull: true,
    allowNullItem: false,
  })
  brandIds?: number[];

  /**
   * Category ids filter.
   *
   * @example "1,null"
   */
  @IdList({
    invalidMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST,
    invalidItemMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST_ITEM,
    requiredItemMessage: CategoryMessage.NULL_CATEGORY_ID_LIST_ITEM,
    allowUndefined: true,
    allowNull: true,
    allowNullItem: false,
  })
  categoryIds?: number[];

  /**
   * Page.
   * Integer greater or equal 1.
   * 1 by default.
   *
   * @example 1
   */
  @Page()
  page?: number;

  /**
   * Page size.
   * Integer from 1 up to 40.
   * 12 by default.
   *
   * @example 20
   */
  @PageSize()
  pageSize?: number;

  /**
   * Sort criteria. "name_asc" by default.
   *
   * @example "name_asc,active_desc"
   */
  @Sort(ProductOrder, { defaultValues: [ProductOrder.NAME_ASC] })
  orderBy?: ProductOrder[];
}
