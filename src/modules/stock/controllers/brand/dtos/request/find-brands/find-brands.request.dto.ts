import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { Active } from '../../../../../../system/decorators/active/active.decorator';
import { Deleted } from '../../../../../../system/decorators/deleted/deleted.decorator';
import { PageSize } from '../../../../../../system/decorators/pagination/page-size.decorator';
import { Page } from '../../../../../../system/decorators/pagination/page.decorator';
import { Sort } from '../../../../../../system/decorators/sort/sort.decorator';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { TextMessage } from '../../../../../../system/enums/messages/text-messages/text-messages.enum';
import { textSearchTransformer } from '../../../../../../system/utils/text-seach/text-search-transformer';
import { BrandOrder } from '../../../../../models/brand-order/brand-order.enum';

export class FindBrandRequestDTO {
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
   * Sort criteria. "name_asc" by default.
   *
   * @example "name_asc,active_desc"
   */

  @Sort(BrandOrder, { defaultValues: [BrandOrder.NAME_ASC] })
  orderBy?: BrandOrder[];
}
