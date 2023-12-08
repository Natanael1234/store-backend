import { ProductOrder } from './product-order.enum';

describe('ProductOrder', () => {
  it('should be defined', () => {
    expect(ProductOrder).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ProductOrder }).toEqual({
      NAME_ASC: 'name_asc',
      NAME_DESC: 'name_desc',
      ACTIVE_ASC: 'active_asc',
      ACTIVE_DESC: 'active_desc',
    });
  });
});
