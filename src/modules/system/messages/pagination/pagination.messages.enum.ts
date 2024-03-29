export enum PaginationMessage {
  PAGE_INVALID = 'Page should be integer',
  PAGE_REQUIRED = 'Page is required',
  PAGE_MIN = 'Page should be greater than or equal to 1',

  PAGE_SIZE_INVALID = 'Page size should be integer',
  PAGE_SIZE_REQUIRED = 'Page size is required',
  PAGE_SIZE_MIN = 'Page size should be greater than or equal to 1',
  PAGE_SIZE_MAX = 'Page size should be greater than or equal to 40',
}
