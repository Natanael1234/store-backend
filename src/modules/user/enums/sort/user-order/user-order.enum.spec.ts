import { UserOrder } from './user-order.enum';

describe('UserOrder', () => {
  it('should be defined', () => {
    expect(UserOrder).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...UserOrder }).toEqual({
      NAME_ASC: 'name_asc',
      NAME_DESC: 'name_desc',
      ACTIVE_ASC: 'active_asc',
      ACTIVE_DESC: 'active_desc',
    });
  });
});
