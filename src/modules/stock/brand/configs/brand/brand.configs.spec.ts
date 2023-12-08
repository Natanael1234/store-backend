import { BrandConfigs } from './brand.configs';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH, BRAND_DEFAULT_ORDER_BY } =
  BrandConfigs;

describe('BrandConfigs', () => {
  it('should de defined', () => {
    expect(BrandConfigs).toBeDefined();
  });

  it('should have NAME_MIN_LENGTH defined as 2', () => {
    expect(NAME_MIN_LENGTH).toEqual(2);
  });

  it('should have NAME_MAX_LENGTH defined as 60', () => {
    expect(NAME_MAX_LENGTH).toEqual(60);
  });

  it('should have BRAND_DEFAULT_ORDER_BY defined as ["name_asc", "active_asc"]', () => {
    expect(BRAND_DEFAULT_ORDER_BY).toEqual(['name_asc', 'active_asc']);
  });
});
