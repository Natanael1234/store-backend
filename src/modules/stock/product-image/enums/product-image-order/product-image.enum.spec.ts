import { ProductImageOrder } from './product-image.enum';

describe('ProductImageOrder', () => {
  it('should be defined', () => {
    expect(ProductImageOrder).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ProductImageOrder }).toEqual({
      NAME_ASC: 'name_asc',
      NAME_DESC: 'name_desc',
      DESCRIPTION_ASC: 'description_asc',
      DESCRIPTION_DESC: 'description_desc',
      ACTIVE_ASC: 'active_asc',
      ACTIVE_DESC: 'active_desc',
    });
  });
});
