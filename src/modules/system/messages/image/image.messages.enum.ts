export enum ImageMessage {
  IMAGE_NOT_FOUND = 'Image not found',

  IMAGE_NOT_DEFINED = 'Image not defined',

  IMAGE_LIST_NOT_DEFINED = 'Images not defined',
  IMAGE_LIST_EMPTY = 'Image list is empty',
  IMAGE_LIST_INVALID = 'Image list is invalid',

  IMAGE_ID_NOT_DEFINED = 'Image id not defined',
  IMAGE_ID_INVALID = 'Invalid image id',
  IMAGE_ID_DUPLICATED = 'Image id is duplicated',

  IMAGE_ID_LIST_INVALID = 'Image id list should be an array',
  IMAGE_ID_LIST_EMPTY = 'Image id list is empty',

  IMAGE_ID_LIST_ITEM_NULL = 'Image id list items cannot be null',
  IMAGE_ID_LIST_ITEM_INVALID = 'Image id list items should be integers greater or equal 1',

  IMAGE_DATA_INVALID = 'Invalid image data',

  MAIN_IS_NULL = 'Main is null',
  MAIN_IS_INVALID = 'Main is invalid',
  MULTIPLE_MAINS = 'Multiple images set as main',

  IMAGE_ITEM_NOT_DEFINED = 'Image item not defined',
  IMAGE_ITEM_INVALID = 'Invalid image item',
}
