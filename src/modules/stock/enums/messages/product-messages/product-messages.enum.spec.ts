import { ProductMessage } from './product-messages.enum';

describe('ProductMessage', () => {
  it('should be defined', () => {
    expect(ProductMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ProductMessage }).toEqual({
      NOT_FOUND: 'Product not found',
      DATA_REQUIRED: 'Product data required',
      REQUIRED: 'Product required',
      ID_REQUIRED: 'Product id is required',
      CODE_REQUIRED: 'Product code is required',
      NAME_REQUIRED: 'Product name is required',
      MODEL_REQUIRED: 'Product model is required',
      BRAND_REQUIRED: 'Product brand is required',
      PRICE_REQUIRED: 'Product price is required',
      QUANTITY_REQUIRED: 'Product quantity is required',
    });
  });
});