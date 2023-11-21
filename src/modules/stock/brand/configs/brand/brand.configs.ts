import { BrandOrder } from '../../enums/brand-order/brand-order.enum';

export class BrandConfigs {
  public static readonly NAME_MIN_LENGTH = 2;
  public static readonly NAME_MAX_LENGTH = 60;

  public static readonly BRAND_DEFAULT_ORDER_BY = [
    BrandOrder.NAME_ASC,
    BrandOrder.ACTIVE_ASC,
  ];
}
