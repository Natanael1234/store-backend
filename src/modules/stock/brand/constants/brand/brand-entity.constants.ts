// TODO: tests
export class BrandConstants {
  static readonly BRAND = 'brand';
  static readonly BRANDS = 'brands';

  static readonly BRAND_ID = 'brand.id';
  static readonly BRAND_NAME = 'brand.name';
  static readonly BRAND_ACTIVE = 'brand.active';
  static readonly BRAND_CREATED = 'brand.created';
  static readonly BRAND_UPDATED = 'brand.updated';
  static readonly BRAND_DELETED_AT = 'brand.deletedAt';
  static readonly BRAND_PRODUCTS = 'brand.products';

  static readonly ID = 'id';
  static readonly NAME = 'name';
  static readonly ACTIVE = 'active';
  static readonly CREATED = 'created';
  static readonly UPDATED = 'updated';
  static readonly DELETED_AT = 'deletedAt';
  static readonly PRODUCTS = 'products';

  static readonly BRAND_ID_EQUALS_TO = 'brand.id = :brandId';
  static readonly BRAND_ID_IN = 'brand.id IN (:...brandIds)';
  static readonly BRAND_ID_IS_NOT_NULL = 'brand.id IS NOT NULL';
  static readonly BRAND_NAME_IS_NOT_NULL = 'brand.name IS NOT NULL';
  static readonly BRAND_NAME_LIKE_TEXT_QUERY =
    'LOWER(brand.name) LIKE :textQuery';
  static readonly BRAND_ACTIVE_EQUALS_TO = 'brand.active = :isActiveBrand';
  static readonly BRAND_DELETED_AT_IS_NOT_NULL = 'brand.deletedAt IS NOT NULL';
}
