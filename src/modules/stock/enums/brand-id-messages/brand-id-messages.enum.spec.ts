import { BrandIdMessage } from './brand-id-quantity-messages.enum';

describe('ProductQuantityMessage', () => {
  it('should be defined', () => {
    expect(BrandIdMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...BrandIdMessage }).toEqual({
      INT: 'Brand id must be integer',
      REQUIRED: 'Brand id is required',
      INVALID: 'Invalid brand id',
    });
  });
});
