import { BrandMessage } from './brand-messages.enum';

describe('BrandMessage', () => {
  it('should be defined', () => {
    expect(BrandMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...BrandMessage }).toEqual({
      NOT_FOUND: 'Brand not found',
      DATA_REQUIRED: 'Brand data required',
      REQUIRED: 'Brand required', // TODO: brandId or brand?

      // brand id
      REQUIRED_BRAND_ID: 'Brand id is required',
      BRAND_ID_TYPE: 'Brand id must be integer or equal 1',
      INVALID_BRAND_ID: 'Invalid brand id',
      NULL_BRAND_ID: 'Null brand id',
    });
  });
});
