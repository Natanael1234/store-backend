import { UserOrder } from '../../enums/sort/user-order/user-order.enum';
import { UserConfigs } from './user.configs';

// TODO: check if all parameters matches
describe('BrandConfigs', () => {
  it('should de defined', () => {
    expect(UserConfigs).toBeDefined();
  });

  it('should contains NAME_MIN_LENGTH', () => {
    expect(UserConfigs.NAME_MIN_LENGTH).toEqual(6);
  });

  it('should contains NAME_MAX_LENGTH', () => {
    expect(UserConfigs.NAME_MAX_LENGTH).toEqual(60);
  });

  it('should contains EMAIL_MAX_LENGTH', () => {
    expect(UserConfigs.EMAIL_MAX_LENGTH).toEqual(60);
  });

  it('should contains PASSWORD_MIN_LENGTH', () => {
    expect(UserConfigs.PASSWORD_MIN_LENGTH).toEqual(6);
  });

  it('should contains PASSWORD_MAX_LENGTH', () => {
    expect(UserConfigs.PASSWORD_MAX_LENGTH).toEqual(12);
  });

  it('should contains USER_DEFAULT_ORDER_BY', () => {
    expect(UserConfigs.USER_DEFAULT_ORDER_BY).toEqual([
      UserOrder.NAME_ASC,
      UserOrder.ACTIVE_ASC,
    ]);
  });
});
