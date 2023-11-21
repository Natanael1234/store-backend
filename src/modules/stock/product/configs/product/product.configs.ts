import { ProductOrder } from '../../enums/product-order/product-order.enum';

export class ProductConfigs {
  // TODO: use uppercase
  public static readonly CODE_MIN_LENGTH = 1;
  public static readonly CODE_MAX_LENGTH = 60;

  public static readonly NAME_MIN_LENGTH = 2;
  public static readonly NAME_MAX_LENGTH = 60;

  public static readonly MODEL_MIN_LENGTH = 1;
  public static readonly MODEL_MAX_LENGTH = 60;

  public static readonly MIN_PRICE = 0;
  public static readonly MAX_PRICE = Number.MAX_SAFE_INTEGER;

  public static readonly MIN_QUANTITY_IN_STOCK = 0;
  public static readonly MAX_QUANTITY_IN_STOCK = Number.MAX_SAFE_INTEGER;

  public static readonly FILTER_BRANDS_IDS_MAX_LENGTH = 8;

  public static readonly FILTER_CATEGORY_IDS_MAX_LENGTH = 8;

  public static readonly PRODUCT_DEFAULT_ORDER_BY = [
    ProductOrder.NAME_ASC,
    ProductOrder.ACTIVE_ASC,
  ];
}
