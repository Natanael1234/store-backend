export enum ImagesMetadataMessage {
  // additional data
  ADDITIONAL_DATA_NOT_DEFINED = 'Addtional data not defined',
  ADDITIONAL_DATA_INVALID = 'Addtional is invalid',

  // metadata array
  METADATA_INVALID = 'Invalid metadata',
  METADATA_ARRAY_INVALID = 'Should be array of file metadata',
  METADATA_NOT_DEFINED = 'No metadata defined',

  IMAGE_OR_METADATA_NOT_DEFINED = 'Nor image or metadata defined',

  // metadata item
  METADATA_ITEM_NOT_DEFINED = 'File metadata item not defined',
  METADATA_ITEM_INVALID_TYPE = 'File metadata item should be a valid image file metadata',

  // imageId
  IMAGE_ID_NOT_DEFINED = 'Image id not defined',
  IMAGE_ID_INVALID = 'Image id is invalid',
  IMAGE_ID_DUPLICATED = 'Image id is duplicated',

  // fileIdx
  FILE_IDX_NOT_DEFINED = 'File index not defined',
  FILE_IDX_NOT_FOUND = 'File index not found',
  FILE_IDX_INVALID = 'File index is invalid',
  FILE_IDX_DUPLICATED = 'File index is duplicated',

  // imageId or fileIdx
  IMAGE_ID_AND_FILE_IDX_NOT_DEFINED = 'Both Image id and file index not defined',
  IMAGE_ID_AND_FILE_IDX_DEFINED = 'Image id and file index defined',

  // name
  NAME_TOO_LONG = 'Name should have a maximum of 60 characters',
  NAME_INVALID_TYPE = 'Name has invalid type',

  // description
  DESCRIPTION_TOO_LONG = 'Description should a maximum of 60 characters',
  DESCRIPTION_INVALID_TYPE = 'Description has invalid type',

  // main
  MAIN_IS_NULL = 'Main is null',
  MAIN_IS_INVALID = 'Main is invalid',
  MULTIPLE_MAINS = 'Multiple images set as main',

  // active
  ACTIVE_IS_INVALID = 'Active is invalid',
  ACTIVE_NOT_DEFINED = 'Active is not defined',
  ACTIVE_IS_NULL = 'Active is null',

  // delete
  DELETE_IS_INVALID = 'Delete is invalid',
  DELETE_NOT_DEFINED = 'Delete is not defined',
  DELETE_IS_NULL = 'Delete is null',

  IMAGE_NOT_RELATED_TO_PRODUCT = 'Image not related to the product',

  IMAGE_NOT_DEFINED = 'Image not defined',
  IMAGE_NOT_ALLOWED = 'Image not allowed',
}
