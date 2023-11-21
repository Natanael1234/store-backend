export enum CategoryMessage {
  NOT_FOUND = 'Category not found',
  DATA_REQUIRED = 'Category data required',
  REQUIRED = 'Category required',
  ID_REQUIRED = 'Category id is required',
  REQUIRED_CATEGORY_ID = 'Category id is required',
  CATEGORY_ID_TYPE = 'Category id should be integer greater or equal 1',
  INVALID_CATEGORY_ID = 'Invalid category id',
  CATEGORY_NAME_REQUIRED = 'Category name is required',
  NULL_CATEGORY_ID = 'Category id is null',
  // parent id
  REQUIRED_PARENT_CATEGORY_ID = 'Parent category id is required',
  INVALID_PARENT_CATEGORY_ID = 'Invalid parent category id',
  PARENT_CATEGORY_ID_TYPE = 'Parent category id should be integer greater or equal 1',
  NULL_PARENT_CATEGORY_ID = 'Parent category id is null',
  PARENT_CATEGORY_NOT_FOUND = 'Parent category not found',
  CANNOT_PARENT_ITSELF = 'Category cannot parent itself',
  CANNOT_DESCEND_FROM_ITSELF = 'Category cannot descent from itself',

  // category id list
  REQUIRED_CATEGORY_ID_LIST = 'Category id list is required',
  NULL_CATEGORY_ID_LIST = 'Null category id list',
  INVALID_CATEGORY_ID_LIST = 'Category id list should be an array',
  INVALID_CATEGORY_ID_LIST_ITEM = 'Category id list items should be integers greater or equal 1',
  NULL_CATEGORY_ID_LIST_ITEM = 'Category id list items cannot be null',

  //  parent category id list
  REQUIRED_PARENT_CATEGORY_ID_LIST = 'Parent category id list is required',
  NULL_PARENT_CATEGORY_ID_LIST = 'Null parent category id list',
  INVALID_PARENT_CATEGORY_ID_LIST = 'Parent category id list should be an array',
  INVALID_PARENT_CATEGORY_ID_LIST_ITEM = 'Parent category id list items should be integers greater or equal 1',
  NULL_PARENT_CATEGORY_ID_LIST_ITEM = 'Parent category id list items cannot be null',
}
