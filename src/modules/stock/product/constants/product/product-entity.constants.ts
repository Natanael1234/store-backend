// TODO: tests
export class ProductConstants {
  static readonly PRODUCT = 'product';
  static readonly PRODUCTS = 'products';

  static readonly PRODUCT_ID = 'product.id';
  static readonly PRODUCT_CODE = 'product.code';
  static readonly PRODUCT_NAME = 'product.name';
  static readonly PRODUCT_MODEL = 'product.model';
  static readonly PRODUCT_ACTIVE = 'product.active';
  static readonly PRODUCT_CREATED = 'product.created';
  static readonly PRODUCT_UPDATED = 'product.updated';
  static readonly PRODUCT_DELETED_AT = 'product.deletedAt';
  static readonly PRODUCT_BRAND = 'product.brand';
  static readonly PRODUCT_CATEGORY = 'product.category';
  static readonly PRODUCT_IMAGES = 'product.images';

  static readonly ID = 'id';
  static readonly CODE = 'code';
  static readonly NAME = 'name';
  static readonly MODEL = 'model';
  static readonly ACTIVE = 'active';
  static readonly CREATED = 'created';
  static readonly UPDATED = 'updated';
  static readonly DELETED_AT = 'deletedAt';
  static readonly BRAND = 'brand';
  static readonly CATEGORY = 'category';
  static readonly IMAGES = 'images';
  static readonly IMAGE = 'image';
  static readonly IMAGES_NAME = 'images.name';

  static readonly PRODUCT_ID_EQUALS_TO = 'product.id = :productId';
  static readonly ID_EQUALS_TO = 'id = :productId';

  static readonly PRODUCT_ID_IN = 'product.id IN (:...productIds)';
  static readonly PRODUCT_CATEGORY_ID_IN =
    'product.categoryId IN (:...categoryIds)';
  static readonly PRODUCT_BRAND_ID_IN = 'product.brandId IN (:...brandIds)';
  static readonly PRODUCT_ID_IS_NOT_NULL = 'product.id IS NOT NULL';
  static readonly PRODUCT_NAME_IS_NOT_NULL = 'product.name IS NOT NULL';
  static readonly PRODUCT_NAME_LIKE_TEXT_QUERY = `LOWER(product.name) LIKE :textQuery`;
  static readonly PRODUCT_ACTIVE_EQUALS_TO =
    'product.active = :isActiveProduct';

  static readonly PRODUCT_DELETED_AT_IS_NOT_NULL =
    'product.deletedAt IS NOT NULL';
  static readonly PRODUCT_DELETED_AT_IS_NULL = 'product.deletedAt IS NULL';

  static readonly BRAND_ACTIVE_EQUALS_TO = 'brand.active = :isActiveBrand';
  static readonly BRAND_DELETED_AT_IS_NOT_NULL = 'brand.deletedAt IS NOT NULL';
  static readonly BRAND_DELETED_AT_IS_NULL = 'brand.deletedAt IS NULL';

  static readonly CATEGORY_ACTIVE_EQUALS_TO =
    'category.active = :isActiveCategory';
  static readonly CATEGORY_DELETED_AT_IS_NOT_NULL =
    'category.deletedAt IS NOT NULL';
  static readonly CATEGORY_DELETED_AT_IS_NULL = 'category.deletedAt IS NULL';

  static readonly IMAGE_MAIN_EQUALS_TO = 'image.main = :main';
}
