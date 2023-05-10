import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../../system/enums/messages/deleted-messages/deleted-messages.enum';
import { PaginationMessage } from '../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { SortMessage } from '../../../../system/enums/messages/sort-messages/sort-messages.enum';
import { TextMessage } from '../../../../system/enums/messages/text-messages/text-messages.enum';
import { getArrayTransformer } from '../../../../system/utils/array/array-transformer';
import {
  normalizePageSizeValue,
  normalizePageValue,
} from '../../../../system/utils/pagination/pagination-transformer';
import { textSearchTransformer } from '../../../../system/utils/text-seach/text-search-transformer';
import { BrandOrder } from '../../../enums/sort/brand-order/brand-order.enum';

const arrayTransformer = getArrayTransformer({
  defaultValues: [BrandOrder.NAME_ASC],
  removeDuplicated: true,
});

export class FindBranddRequestDTO {
  @IsString({ message: TextMessage.STRING })
  @IsOptional()
  @Transform((options) => textSearchTransformer(options.value))
  @Expose()
  query?: string;

  @IsEnum(ActiveFilter, { message: ActiveMessage.INVALID })
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

  @IsInt({ message: PaginationMessage.PAGE_INT })
  @Transform((options) => normalizePageValue(options.obj.page))
  @Expose()
  page?: number;

  @IsInt({ message: PaginationMessage.PAGE_SIZE_INT })
  @Transform((options) => normalizePageSizeValue(options.obj.pageSize))
  @Expose()
  pageSize?: number;

  @IsEnum(BrandOrder, { each: true, message: SortMessage.INVALID })
  @Transform(({ value }) => arrayTransformer(value))
  @Expose()
  orderBy?: BrandOrder[];
}
