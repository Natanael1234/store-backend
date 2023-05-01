import { PaginationConfig } from './pagination.config';

describe('PaginationRequestDTO', () => {
  it('should be defined', () => {
    expect(PaginationConfig).toBeDefined();
  });

  it('should receive PaginationConfig.MIN_PAGE', async () => {
    expect(PaginationConfig.MIN_PAGE).toEqual(1);
  });

  it('should receive PaginationConfig.DEFAULT_PAGE', async () => {
    expect(PaginationConfig.DEFAULT_PAGE).toEqual(1);
  });

  it('should receive PaginationConfig.MIN_PAGE_SIZE', async () => {
    expect(PaginationConfig.MIN_PAGE_SIZE).toEqual(1);
  });

  it('should receive PaginationConfig.DEFAULT_PAGE_SIZE', async () => {
    expect(PaginationConfig.DEFAULT_PAGE_SIZE).toEqual(12);
  });

  it('should receive PaginationConfig.MAX_PAGE_SIZE', async () => {
    expect(PaginationConfig.MAX_PAGE_SIZE).toEqual(40);
  });
});
