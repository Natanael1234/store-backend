import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Active } from '../../../../../../system/decorators/active/active.decorator';
import { IdList } from '../../../../../../system/decorators/id-list/id-list.decorator';
import { Sort } from '../../../../../../system/decorators/sort/sort.decorator';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { DeletedMessage } from '../../../../../../system/enums/messages/deleted-messages/deleted-messages.enum';
import { PaginationMessage } from '../../../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { TextMessage } from '../../../../../../system/enums/messages/text-messages/text-messages.enum';
import { getEnumTransformer } from '../../../../../../system/utils/enum/enum-transformer';
import {
  normalizePageSizeValue,
  normalizePageValue,
} from '../../../../../../system/utils/pagination/pagination-transformer';
import { textSearchTransformer } from '../../../../../../system/utils/text-seach/text-search-transformer';
import { BrandMessage } from '../../../../../enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../../../../../enums/messages/category-messages/category-messages.enum';
import { ProductOrder } from '../../../../../enums/sort/product-order/product-order.enum';

const activeEnumTransformer = getEnumTransformer(ActiveFilter, {
  defaultValue: ActiveFilter.ACTIVE,
});

const deletedEnumTransformer = getEnumTransformer(DeletedFilter, {
  defaultValue: DeletedFilter.NOT_DELETED,
});

export class FindProductRequestDTO {
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
  @IsEnum(DeletedFilter, { message: DeletedMessage.INVALID })
  @Transform((options) => deletedEnumTransformer(options.value))
  @Expose()
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
  @Sort(ProductOrder, { defaultValues: [ProductOrder.NAME_ASC] })
  orderBy?: ProductOrder[];
}
