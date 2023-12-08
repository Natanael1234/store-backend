import { ProductMessage } from './product.messages.enum';

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
      INVALID_ID: 'Invalid product id',
      CODE_REQUIRED: 'Product code is required',
      NAME_REQUIRED: 'Product name is required',
      MODEL_REQUIRED: 'Product model is required',
      BRAND_REQUIRED: 'Product brand is required',
      PRICE_REQUIRED: 'Product price is required',
      QUANTITY_REQUIRED: 'Product quantity is required',

      // product id
      REQUIRED_PRODUCT_ID: 'Product id is required',
      PRODUCT_ID_TYPE: 'Product id should be integer or equal 1',
      INVALID_PRODUCT_ID: 'Invalid product id',
      NULL_PRODUCT_ID: 'Null product id',
    });
  });
});
