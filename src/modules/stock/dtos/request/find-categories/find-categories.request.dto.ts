import { Expose, Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { ActiveMessage } from '../../../../system/enums/messages/active-messages/active-messages.enum';
import { DeletedMessage } from '../../../../system/enums/messages/deleted-messages/deleted-messages.enum';
import { PaginationMessage } from '../../../../system/enums/messages/pagination-messages/pagination-messages.enum';
import { SortMessage } from '../../../../system/enums/messages/sort-messages/sort-messages.enum';
import { TextMessage } from '../../../../system/enums/messages/text-messages/text-messages.enum';
import { getEnumTransformer } from '../../../../system/utils/enum/enum-transformer';
import { getJSONTransformer } from '../../../../system/utils/json/json-transformer';

import { IdList } from '../../../../system/decorators/id-list/id-list.decorator';
import {
  normalizePageSizeValue,
  normalizePageValue,
} from '../../../../system/utils/pagination/pagination-transformer';
import { textSearchTransformer } from '../../../../system/utils/text-seach/text-search-transformer';
import { CategoryMessage } from '../../../enums/messages/category-messages/category-messages.enum';
import { CategoryOrder } from '../../../enums/sort/category-order/category-order.enum';

const activeEnumTransformer = getEnumTransformer(ActiveFilter, {
  defaultValue: ActiveFilter.ACTIVE,
});

const deletedEnumTransformer = getEnumTransformer(DeletedFilter, {
  defaultValue: DeletedFilter.NOT_DELETED,
});

const orderByArrayTransformer = getJSONTransformer({
  defaultValues: [CategoryOrder.NAME_ASC],
  useDefaulValuesInsteadOfEmptyArray: true,
  removeDuplicated: true,
});

export class FindCategoriesRequestDTO {
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
    invalidMessage: CategoryMessage.INVALID_PARENT_CATEGORY_ID_LIST,
    invalidItemMessage: CategoryMessage.INVALID_PARENT_CATEGORY_ID_LIST_ITEM,
    requiredItemMessage: CategoryMessage.NULL_PARENT_CATEGORY_ID_LIST_ITEM,
    allowUndefined: true,
    allowNull: true,
    allowNullItem: true,
  })
  @Expose()
  parentIds?: number[];

  @IsInt({ message: PaginationMessage.PAGE_INT })
  @Transform((options) => normalizePageValue(options.obj.page))
  @Expose()
  page?: number;

  @IsInt({ message: PaginationMessage.PAGE_SIZE_INT })
  @Transform((options) => normalizePageSizeValue(options.obj.pageSize))
  @Expose()
  pageSize?: number;

  @IsEnum(CategoryOrder, { each: true, message: SortMessage.INVALID })
  @Transform(({ value }) => orderByArrayTransformer(value))
  @Expose()
  orderBy?: CategoryOrder[];
}
