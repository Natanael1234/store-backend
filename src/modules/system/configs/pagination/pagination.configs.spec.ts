import { PaginationConfigs } from './pagination.configs';

describe('PaginationConfigs', () => {
  it('should be defined', () => {
    expect(PaginationConfigs).toBeDefined();
  });

  it('MIN_PAGE should be defined', async () => {
    expect(PaginationConfigs.MIN_PAGE).toEqual(1);
  });

  it('DEFAULT_PAGE should be defined', async () => {
    expect(PaginationConfigs.DEFAULT_PAGE).toEqual(1);
  });

  it('MIN_PAGE_SIZE should be defined', async () => {
    expect(PaginationConfigs.MIN_PAGE_SIZE).toEqual(1);
  });

  it('DEFAULT_PAGE_SIZE should be defined', async () => {
    expect(PaginationConfigs.DEFAULT_PAGE_SIZE).toEqual(12);
  });

  it('MAX_PAGE_SIZE should be defined', async () => {
    expect(PaginationConfigs.MAX_PAGE_SIZE).toEqual(40);
  });
});
