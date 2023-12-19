import { testConvertStaticPropertiesToObject } from '../../../../../test/test-utils';
import { ProductConstants } from './product-entity.constants';

describe('ProductConstants', () => {
  it('should de defined', () => {
    expect(ProductConstants).toBeDefined();
  });

  it('sohuld have correct properties', () => {
    const values = testConvertStaticPropertiesToObject(ProductConstants);
    expect(values).toEqual({
      PRODUCT: 'product',
      PRODUCTS: 'products',

      PRODUCT_ID: 'product.id',
      PRODUCT_CODE: 'product.code',
      PRODUCT_NAME: 'product.name',
      PRODUCT_MODEL: 'product.model',
      PRODUCT_ACTIVE: 'product.active',
      PRODUCT_CREATED: 'product.created',
      PRODUCT_UPDATED: 'product.updated',
      PRODUCT_DELETED_AT: 'product.deletedAt',
      PRODUCT_BRAND: 'product.brand',
      PRODUCT_CATEGORY: 'product.category',
      PRODUCT_IMAGES: 'product.images',

      ID: 'id',
      CODE: 'code',
      NAME: 'name',
      MODEL: 'model',
      ACTIVE: 'active',
      CREATED: 'created',
      UPDATED: 'updated',
      DELETED_AT: 'deletedAt',
      BRAND: 'brand',
      CATEGORY: 'category',
      IMAGES: 'images',
      IMAGE: 'image',
      IMAGES_NAME: 'images.name',

      PRODUCT_ID_EQUALS_TO: 'product.id = :productId',
      PRODUCT_ID_IN: 'product.id IN (:...productIds)',
      PRODUCT_CATEGORY_ID_IN: 'product.categoryId IN (:...categoryIds)',
      PRODUCT_BRAND_ID_IN: 'product.brandId IN (:...brandIds)',
      PRODUCT_ID_IS_NOT_NULL: 'product.id IS NOT NULL',
      ID_EQUALS_TO: 'id = :productId',
      PRODUCT_NAME_IS_NOT_NULL: 'product.name IS NOT NULL',
      PRODUCT_NAME_LIKE_TEXT_QUERY: `LOWER(product.name) LIKE :textQuery`,
      PRODUCT_ACTIVE_EQUALS_TO: 'product.active = :isActiveProduct',

      PRODUCT_DELETED_AT_IS_NOT_NULL: 'product.deletedAt IS NOT NULL',
      PRODUCT_DELETED_AT_IS_NULL: 'product.deletedAt IS NULL',

      BRAND_ACTIVE_EQUALS_TO: 'brand.active = :isActiveBrand',
      BRAND_DELETED_AT_IS_NOT_NULL: 'brand.deletedAt IS NOT NULL',
      BRAND_DELETED_AT_IS_NULL: 'brand.deletedAt IS NULL',

      CATEGORY_ACTIVE_EQUALS_TO: 'category.active = :isActiveCategory',
      CATEGORY_DELETED_AT_IS_NOT_NULL: 'category.deletedAt IS NOT NULL',
      CATEGORY_DELETED_AT_IS_NULL: 'category.deletedAt IS NULL',

      IMAGE_MAIN_EQUALS_TO: 'image.main = :main',
    });
  });
});
