import { ProductImageConfigs } from './product-image.configs';

describe('BrandConfigs', () => {
  it('should de defined', () => {
    expect(ProductImageConfigs).toBeDefined();
  });

  it('should have NAME_MIN_LENGTH defined as 0', () => {
    expect(ProductImageConfigs.NAME_MIN_LENGTH).toEqual(0);
  });

  it('should have NAME_MAX_LENGTH defined as 60', () => {
    expect(ProductImageConfigs.NAME_MAX_LENGTH).toEqual(60);
  });

  it('should have DESCRIPTION_MIN_LENGTH defined as 0', () => {
    expect(ProductImageConfigs.DESCRIPTION_MIN_LENGTH).toEqual(0);
  });

  it('should have DESCRIPTION_MAX_LENGTH defined as 60', () => {
    expect(ProductImageConfigs.DESCRIPTION_MAX_LENGTH).toEqual(60);
  });

  it('should have MAX_IMAGE_COUNT defined as 12', () => {
    expect(ProductImageConfigs.MAX_IMAGE_COUNT).toEqual(12);
  });
});
