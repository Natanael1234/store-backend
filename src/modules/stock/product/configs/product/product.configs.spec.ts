import { ProductConfigs } from './product.configs';

describe('ProductConfigs', () => {
  it('should de defined', () => {
    expect(ProductConfigs).toBeDefined();
  });

  it('should have CODE_MIN_LENGTH defined as 1', () => {
    expect(ProductConfigs.CODE_MIN_LENGTH).toEqual(1);
  });

  it('should have CODE_MAX_LENGTH defined as 60', () => {
    expect(ProductConfigs.CODE_MAX_LENGTH).toEqual(60);
  });

  it('should have NAME_MIN_LENGTH defined as 2', () => {
    expect(ProductConfigs.NAME_MIN_LENGTH).toEqual(2);
  });

  it('should have NAME_MAX_LENGTH defined as 60', () => {
    expect(ProductConfigs.NAME_MAX_LENGTH).toEqual(60);
  });

  it('should have MODEL_MIN_LENGTH defined as 1', () => {
    expect(ProductConfigs.MODEL_MIN_LENGTH).toEqual(1);
  });

  it('should have MODEL_MAX_LENGTH defined as 60', () => {
    expect(ProductConfigs.MODEL_MAX_LENGTH).toEqual(60);
  });

  it('should have MIN_PRICE defined as 0', () => {
    expect(ProductConfigs.MIN_PRICE).toEqual(0);
  });

  it('should have MAX_PRICE defined as 0', () => {
    expect(ProductConfigs.MAX_PRICE).toEqual(Number.MAX_SAFE_INTEGER);
  });

  it('should have MIN_QUANTITY_IN_STOCK defined as 0', () => {
    expect(ProductConfigs.MIN_QUANTITY_IN_STOCK).toEqual(0);
  });

  it('should have MAX_QUANTITY_IN_STOCK defined as 0', () => {
    expect(ProductConfigs.MAX_QUANTITY_IN_STOCK).toEqual(
      Number.MAX_SAFE_INTEGER,
    );
  });

  it('should have FILTER_BRANDS_IDS_MAX_LENGTH defined as 8', () => {
    expect(ProductConfigs.FILTER_BRANDS_IDS_MAX_LENGTH).toEqual(8);
  });

  it('should have FILTER_CATEGORY_IDS_MAX_LENGTH defined as 8', () => {
    expect(ProductConfigs.FILTER_CATEGORY_IDS_MAX_LENGTH).toEqual(8);
  });
});
