import { CategoryOrder } from './category-order.enum';

describe('CategoryOrder', () => {
  it('should be defined', () => {
    expect(CategoryOrder).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...CategoryOrder }).toEqual({
      NAME_ASC: 'name_asc',
      NAME_DESC: 'name_desc',
      ACTIVE_ASC: 'active_asc',
      ACTIVE_DESC: 'active_desc',
    });
  });
});
