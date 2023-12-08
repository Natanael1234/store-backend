import { CategoryOrder } from '../../enums/category-order/category-order.enum';

export class CategoryConfigs {
  public static readonly NAME_MIN_LENGTH = 2;
  public static readonly NAME_MAX_LENGTH = 60;

  public static readonly FILTER_PARENT_IDS_MAX_LENGTH = 8;

  public static readonly CATEGORY_DEFAULT_ORDER_BY = [
    CategoryOrder.NAME_ASC,
    CategoryOrder.ACTIVE_ASC,
  ];
}
