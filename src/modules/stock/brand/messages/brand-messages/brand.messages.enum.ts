export enum BrandMessage {
  NOT_FOUND = 'Brand not found',
  DATA_REQUIRED = 'Brand data required',
  DATA_INVALID = 'Invalid brand data',
  REQUIRED = 'Brand required', // TODO: brandId or brand?

  // brand id
  REQUIRED_BRAND_ID = 'Brand id is required',
  BRAND_ID_TYPE = 'Brand id should be integer or equal 1',
  INVALID_BRAND_ID = 'Invalid brand id',
  NULL_BRAND_ID = 'Null brand id',

  // brand id list
  REQUIRED_BRAND_ID_LIST = 'Brand id list is required',
  NULL_BRAND_ID_LIST = 'Null brand id list',
  INVALID_BRAND_ID_LIST = 'Brand id list should be an array',
  INVALID_BRAND_ID_LIST_ITEM = 'Brand id list items should be integers greater or equal 1',
  NULL_BRAND_ID_LIST_ITEM = 'Brand id list items cannot be null',

  // authorization
  PRIVATE_ACCESS = 'Cannot access private brands',
  DELETED_ACCESS = 'Cannot access deleted brands',
}
