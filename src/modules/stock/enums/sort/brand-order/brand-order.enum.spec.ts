import { BrandOrder } from './brand-order.enum';

describe('ProductCodeMessage', () => {
  it('should be defined', () => {
    expect(BrandOrder).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...BrandOrder }).toEqual({
      NAME_ASC: 'name_asc',
      NAME_DESC: 'name_desc',
      ACTIVE_ASC: 'active_asc',
      ACTIVE_DESC: 'active_desc',
    });
  });
});
