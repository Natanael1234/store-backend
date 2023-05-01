import { PaginationMessage } from './pagination-messages.enum';

describe('PaginationMessage', () => {
  it('should be defined', () => {
    expect(PaginationMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...PaginationMessage }).toEqual({
      PAGE_INT: 'Page must be positive integer',
      PAGE_REQUIRED: 'Page is required',
      PAGE_MIN: 'Page should be greater than or equal to 1',

      PAGE_SIZE_INT: 'Page size must be positive integer',
      PAGE_SIZE_REQUIRED: 'Page size is required',
      PAGE_SIZE_MIN: 'Page size should be greater than or equal to 1',
    });
  });
});
