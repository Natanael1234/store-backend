import { BrandMessage } from './brand-messages.enum';

describe('BrandMessage', () => {
  it('should be defined', () => {
    expect(BrandMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...BrandMessage }).toEqual({
      NOT_FOUND: 'Brand not found',
      DATA_REQUIRED: 'Brand data required',
      REQUIRED: 'Brand required',
      ID_REQUIRED: 'Brand id is required',
      NAME_REQUIRED: 'Brand name is required',
    });
  });
});
