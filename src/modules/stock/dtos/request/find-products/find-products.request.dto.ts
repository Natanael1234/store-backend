import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { IdList } from '../../../../system/decorators/id-list/id-list.decorator';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../../system/enums/messages/deleted-messages/deleted-messages.enum';
import { PaginationMessage } from '../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { SortMessage } from '../../../../system/enums/messages/sort-messages/sort-messages.enum';
import { TextMessage } from '../../../../system/enums/messages/text-messages/text-messages.enum';
import { getEnumTransformer } from '../../../../system/utils/enum/enum-transformer';
import { getJSONTransformer } from '../../../../system/utils/json/json-transformer';
import {
  normalizePageSizeValue,
  normalizePageValue,
} from '../../../../system/utils/pagination/pagination-transformer';
import { textSearchTransformer } from '../../../../system/utils/text-seach/text-search-transformer';
import { BrandMessage } from '../../../enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../../../enums/messages/category-messages/category-messages.enum';
import { ProductOrder } from '../../../enums/sort/product-order/product-order.enum';

const activeEnumTransformer = getEnumTransformer(ActiveFilter, {
  defaultValue: ActiveFilter.ACTIVE,
});

const deletedEnumTransformer = getEnumTransformer(DeletedFilter, {
  defaultValue: DeletedFilter.NOT_DELETED,
});

const orderByArrayTransformer = getJSONTransformer({
  defaultValues: [ProductOrder.NAME_ASC],
  useDefaulValuesInsteadOfEmptyArray: true,
  removeDuplicated: true,
});

export class FindProductRequestDTO {
  @IsString({ message: TextMessage.STRING })
  @IsOptional()
  @Transform((options) => textSearchTransformer(options.value))
  @Expose()
  query?: string;

  @IsEnum(ActiveFilter, { message: ActiveMessage.TYPE })
  @Transform((options) => activeEnumTransformer(options.value))
  @Expose()
  active?: ActiveFilter;

  @IsEnum(DeletedFilter, { message: DeletedMessage.INVALID })
  @Transform((options) => deletedEnumTransformer(options.value))
  @Expose()
  deleted?: DeletedFilter;

  @IdList({
    invalidMessage: BrandMessage.INVALID_BRAND_ID_LIST,
    invalidItemMessage: BrandMessage.INVALID_BRAND_ID_LIST_ITEM,
    requiredItemMessage: BrandMessage.NULL_BRAND_ID_LIST_ITEM,
    allowUndefined: true,
    allowNull: true,
    allowNullItem: false,
  })
  @Expose()
  brandIds?: number[];

  @IdList({
    invalidMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST,
    invalidItemMessage: CategoryMessage.INVALID_CATEGORY_ID_LIST_ITEM,
    requiredItemMessage: CategoryMessage.NULL_CATEGORY_ID_LIST_ITEM,
    allowUndefined: true,
    allowNull: true,
    allowNullItem: false,
  })
  @Expose()
  categoryIds?: number[];

  @IsInt({ message: PaginationMessage.PAGE_INT })
  @Transform((options) => normalizePageValue(options.obj.page))
  @Expose()
  page?: number;

  @IsInt({ message: PaginationMessage.PAGE_SIZE_INT })
  @Transform((options) => normalizePageSizeValue(options.obj.pageSize))
  @Expose()
  pageSize?: number;

  @IsEnum(ProductOrder, { each: true, message: SortMessage.INVALID })
  @Transform(({ value }) => orderByArrayTransformer(value))
  @Expose()
  orderBy?: ProductOrder[];
}
