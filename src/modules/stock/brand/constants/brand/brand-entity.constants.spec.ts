import { testConvertStaticPropertiesToObject } from '../../../../../test/test-utils';
import { BrandConstants } from './brand-entity.constants';

describe('BrandConstants', () => {
  it('should de defined', () => {
    expect(BrandConstants).toBeDefined();
  });

  it('sohuld have correct properties', () => {
    const values = testConvertStaticPropertiesToObject(BrandConstants);
    expect(values).toEqual({
      BRAND: 'brand',
      BRANDS: 'brands',

      BRAND_ID: 'brand.id',
      BRAND_NAME: 'brand.name',
      BRAND_ACTIVE: 'brand.active',
      BRAND_CREATED: 'brand.created',
      BRAND_UPDATED: 'brand.updated',
      BRAND_DELETED_AT: 'brand.deletedAt',
      BRAND_PRODUCTS: 'brand.products',

      ID: 'id',
      NAME: 'name',
      ACTIVE: 'active',
      CREATED: 'created',
      UPDATED: 'updated',
      DELETED_AT: 'deletedAt',
      PRODUCTS: 'products',

      BRAND_ID_EQUALS_TO: 'brand.id = :brandId',
      BRAND_ID_IN: 'brand.id IN (:...brandIds)',
      BRAND_ID_IS_NOT_NULL: 'brand.id IS NOT NULL',
      BRAND_NAME_IS_NOT_NULL: 'brand.name IS NOT NULL',
      BRAND_NAME_LIKE_TEXT_QUERY: 'LOWER(brand.name) LIKE :textQuery',
      BRAND_ACTIVE_EQUALS_TO: 'brand.active = :active',
      BRAND_DELETED_AT_IS_NOT_NULL: 'brand.deletedAt IS NOT NULL',
    });
  });
});
