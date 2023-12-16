import { Active } from '../../../../system/decorators/active/active.decorator';
import { Deleted } from '../../../../system/decorators/deleted/deleted.decorator';
import { PageSize } from '../../../../system/decorators/pagination/page-size.decorator';
import { Page } from '../../../../system/decorators/pagination/page.decorator';
import { Sort } from '../../../../system/decorators/sort/sort.decorator';
import { TextQuery } from '../../../../system/decorators/text-query/text-query.decorator';
import { UuidList } from '../../../../system/decorators/uuid-list/uuid-list.decorator';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ProductConfigs } from '../../configs/product/product.configs';
import { ProductOrder } from '../../enums/product-order/product-order.enum';

export class FindProductsRequestDTO {
  /**
   * Textual query.
   *
   * @example "roduct 1"
   */
  @TextQuery()
  textQuery?: string;

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
   * @example ['f136f640-90b7-11ed-a2a0-fd911f8f7f38']
   */
  @UuidList({
    label: 'brand ids',
    allowUndefined: true,
    allowNull: true,
    allowNullItem: false,
    maxLength: ProductConfigs.FILTER_BRANDS_IDS_MAX_LENGTH,
  })
  brandIds?: string[];

  /**
   * Category ids filter.
   *
   * @example ['f136f640-90b7-11ed-a2a0-fd911f8f7f38']
   */
  @UuidList({
    label: 'category ids',
    allowUndefined: true,
    allowNull: true,
    allowNullItem: false,
    maxLength: ProductConfigs.FILTER_CATEGORY_IDS_MAX_LENGTH,
  })
  categoryIds?: string[];

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
  @Sort(ProductOrder, {
    defaultValues: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
  })
  orderBy?: ProductOrder[];
}
