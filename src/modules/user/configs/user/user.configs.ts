import { UserOrder } from '../../enums/sort/user-order/user-order.enum';

export class UserConfigs {
  public static readonly NAME_MIN_LENGTH = 6;
  public static readonly NAME_MAX_LENGTH = 60;

  public static readonly EMAIL_MAX_LENGTH = 60;

  public static readonly PASSWORD_MIN_LENGTH = 6;
  public static readonly PASSWORD_MAX_LENGTH = 12;

  public static readonly USER_DEFAULT_ORDER_BY = [
    UserOrder.NAME_ASC,
    UserOrder.ACTIVE_ASC,
  ];
}
