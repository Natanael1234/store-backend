// TODO: tests
export class ProductImageConstants {
  static readonly PRODUCT_IMAGE = 'product_image';
  static readonly PRODUCT_IMAGES = 'product_images';

  static readonly PRODUCT_IMAGE_ID = 'product_image.id';
  static readonly PRODUCT_IMAGE_NAME = 'product_image.name';
  static readonly PRODUCT_IMAGE_DESCRIPTON = 'product_image.description';
  static readonly PRODUCT_IMAGE_IMAGE = 'product_image.image';
  static readonly PRODUCT_IMAGE_THUMBNAIL = 'product_image.thumbnail';
  static readonly PRODUCT_IMAGE_MAIN = 'product_image.main';
  static readonly PRODUCT_IMAGE_ACTIVE = 'product_image.active';
  static readonly PRODUCT_IMAGE_CREATED = 'product_image.created';
  static readonly PRODUCT_IMAGE_UPDATED = 'product_image.updated';
  static readonly PRODUCT_IMAGE_DELETED_AT = 'product_image.deletedAt';
  static readonly PRODUCT_IMAGE_PRODUCT_ID = 'product_image.productId';

  static readonly ID = 'id';
  static readonly NAME = 'name';
  static readonly DESCRIPTION = 'description';
  static readonly IMAGE = 'product_image.image';
  static readonly THUMBNAIL = 'product_image.thumbnail';
  static readonly MAIN = 'product_image.main';
  static readonly ACTIVE = 'active';
  static readonly CREATED = 'created';
  static readonly UPDATED = 'updated';
  static readonly DELETED_AT = 'deletedAt';
  static readonly PRODUCT_ID = 'product_image.productId';

  static readonly PRODUCT_IMAGE_ID_EQUALS_TO =
    'product_image.id = :productImageId';
  static readonly PRODUCT_IMAGE_ID_IN =
    'product_image.id IN (:...productImageIds)';
  static readonly PRODUCT_IMAGE_ACTIVE_EQUALS_TO =
    'product_image.active = :active';
  static readonly PRODUCT_IMAGE_DELETED_AT_IS_NOT_NULL =
    'product_image.deletedAt IS NOT NULL';
  static readonly PRODUCT_IMAGE_DELETED_AT_IS_NULL =
    'product_image.deletedAt IS NULL';

  static readonly PRODUCT_IMAGE_PRODUCT_ID_EQUALS_TO =
    'product_image.productId = :productId';
}
