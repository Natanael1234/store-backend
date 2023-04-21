import { ProductQuantityMessage } from './quantity-messages.enum';

describe('ProductQuantityMessage', () => {
  it('should be defined', () => {
    expect(ProductQuantityMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ProductQuantityMessage }).toEqual({
      NUMBER: 'Quantity must be number',
      REQUIRED: 'Quantity is required',
      MIN: 'The minimum quantity is 0',
    });
  });
});
