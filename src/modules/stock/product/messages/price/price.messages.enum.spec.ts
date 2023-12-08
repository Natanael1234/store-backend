import { PriceMessage } from './price.messages.enum';

describe('ProductPriceMessage', () => {
  it('should be defined', () => {
    expect(PriceMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...PriceMessage }).toEqual({
      NUMBER: 'Price should be number',
      REQUIRED: 'Price is required',
      MIN: 'The minimum price is 0',
    });
  });
});
