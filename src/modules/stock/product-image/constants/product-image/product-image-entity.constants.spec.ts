import { testConvertStaticPropertiesToObject } from '../../../../../test/test-utils';
import { ProductImageConstants } from './product-image-entity.constants';

describe('ProductImageConstants', () => {
  it('should de defined', () => {
    expect(ProductImageConstants).toBeDefined();
  });

  it('sohuld have correct properties', () => {
    const values = testConvertStaticPropertiesToObject(ProductImageConstants);
    expect(values).toEqual({
      PRODUCT_IMAGE: 'product_image',
      PRODUCT_IMAGES: 'product_images',

      PRODUCT_IMAGE_ID: 'product_image.id',
      PRODUCT_IMAGE_NAME: 'product_image.name',
      PRODUCT_IMAGE_DESCRIPTON: 'product_image.description',
      PRODUCT_IMAGE_IMAGE: 'product_image.image',
      PRODUCT_IMAGE_THUMBNAIL: 'product_image.thumbnail',
      PRODUCT_IMAGE_MAIN: 'product_image.main',
      PRODUCT_IMAGE_ACTIVE: 'product_image.active',
      PRODUCT_IMAGE_CREATED: 'product_image.created',
      PRODUCT_IMAGE_UPDATED: 'product_image.updated',
      PRODUCT_IMAGE_DELETED_AT: 'product_image.deletedAt',
      PRODUCT_IMAGE_PRODUCT_ID: 'product_image.productId',

      ID: 'id',
      NAME: 'name',
      DESCRIPTION: 'description',
      IMAGE: 'product_image.image',
      THUMBNAIL: 'product_image.thumbnail',
      MAIN: 'product_image.main',
      ACTIVE: 'active',
      CREATED: 'created',
      UPDATED: 'updated',
      DELETED_AT: 'deletedAt',
      PRODUCT_ID: 'product_image.productId',

      PRODUCT_IMAGE_ID_EQUALS_TO: 'product_image.id = :productImageId',
      PRODUCT_IMAGE_ID_IN: 'product_image.id IN (:...productImageIds)',
      PRODUCT_IMAGE_ACTIVE_EQUALS_TO: 'product_image.active = :active',
      PRODUCT_IMAGE_DELETED_AT_IS_NOT_NULL:
        'product_image.deletedAt IS NOT NULL',
      PRODUCT_IMAGE_DELETED_AT_IS_NULL: 'product_image.deletedAt IS NULL',

      PRODUCT_IMAGE_PRODUCT_ID_EQUALS_TO:
        'product_image.productId = :productId',
    });
  });
});
