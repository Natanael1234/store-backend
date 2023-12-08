import { PaginationConfigs } from '../../../../configs/pagination/pagination.configs';
import {
  normalizePageSizeValue,
  normalizePageValue,
} from './pagination-transformer';

describe('pagination-transformer', () => {
  describe('normalizePageValue', () => {
    const minPage = PaginationConfigs.MIN_PAGE;
    const defaultPage = PaginationConfigs.DEFAULT_PAGE;

    it('should return value equal to minimum allowed page when page parameter is equal to minimum allowed page', async () => {
      expect(normalizePageValue(minPage)).toEqual(minPage);
    });

    it('should return value greater than minimum allowed page when page parameter is greater than minimum allowed page', async () => {
      expect(normalizePageValue(minPage + 1)).toEqual(minPage + 1);
    });

    it('should return value equal to minimum allowed page when page parameters is lower than minimum allowed page', async () => {
      expect(normalizePageValue(minPage - 1)).toEqual(minPage);
    });

    it('should return large integer when page parameter is large integer', async () => {
      expect(normalizePageValue(12000)).toEqual(12000);
    });

    it('should return value equal to minimum allowed page when page parameter is null', async () => {
      expect(normalizePageValue(null)).toEqual(defaultPage);
    });

    it('should return value equal to minimum allowed page when page parameter is undefined', async () => {
      expect(normalizePageValue(undefined)).toEqual(defaultPage);
    });

    it('should return string when page parameter is string', async () => {
      const page = `${minPage}`;
      expect(normalizePageValue(page)).toEqual(defaultPage);
    });

    it('should return float when page parameter is float', async () => {
      expect(normalizePageValue(1.1)).toEqual(defaultPage);
    });

    it('should return negative float when page parameter is negative float', async () => {
      expect(normalizePageValue(-1.1)).toEqual(defaultPage);
    });

    it('should return negative boolean when page parameter is boolean', async () => {
      expect(normalizePageValue(true)).toEqual(defaultPage);
    });

    it('should return array when page parameter is array', async () => {
      expect(normalizePageValue([])).toEqual(defaultPage);
    });

    it('should return object when page parameter is object', async () => {
      expect(normalizePageValue({})).toEqual(defaultPage);
    });
  });

  describe('normalizePageSizeValue', () => {
    const minPageSize = PaginationConfigs.MIN_PAGE_SIZE;

    const maxPageSize = PaginationConfigs.MAX_PAGE_SIZE;

    const defaultPageSize = PaginationConfigs.DEFAULT_PAGE_SIZE;

    it('should return value equal to minimum allowed pageSize when pageSize parameter is equal to minimum allowed pageSize', async () => {
      expect(normalizePageSizeValue(minPageSize)).toEqual(minPageSize);
    });

    it('should return value minimum allowed pageSize when pageSize parameter is lower than minimum allowed pageSize', async () => {
      expect(normalizePageSizeValue(minPageSize - 1)).toEqual(minPageSize);
    });

    it('should return value greater tham minimum allowed pageSize when pageSize parameters is greater than minimum allowed pageSize', async () => {
      expect(normalizePageSizeValue(minPageSize + 1)).toEqual(minPageSize + 1);
    });

    it('should return value lower to than maximum allowed pageSize when pageSize parameter is lower than maximum allowed pageSize', async () => {
      expect(normalizePageSizeValue(maxPageSize - 1)).toEqual(maxPageSize - 1);
    });

    it('should return maximuim page size when pageSize parameter is equal to maximum allowed pageSize', async () => {
      expect(normalizePageSizeValue(maxPageSize)).toEqual(maxPageSize);
    });

    it('should return maximum page size when pageSize parameter greater than maximum allowed pageSize', async () => {
      expect(normalizePageSizeValue(maxPageSize + 1)).toEqual(maxPageSize);
    });

    it('should return default pageSize when pageSize parameter is null', async () => {
      expect(normalizePageSizeValue(null)).toEqual(defaultPageSize);
    });

    it('should return default pageSize when pageSize parameter is undefined', async () => {
      expect(normalizePageSizeValue(undefined)).toEqual(defaultPageSize);
    });

    it('should return default pageSize when pageSize parameter is string', async () => {
      const pageSize = `${minPageSize}`;
      expect(normalizePageSizeValue(pageSize)).toEqual(defaultPageSize);
    });

    it('should return default pageSize when pageSize parameter is float', async () => {
      expect(normalizePageSizeValue(1.1)).toEqual(defaultPageSize);
    });

    it('should return default pageSize float when pageSize parameter is negative float', async () => {
      expect(normalizePageSizeValue(-1.1)).toEqual(defaultPageSize);
    });

    it('should return default pageSize boolean when pageSize parameter is boolean', async () => {
      expect(normalizePageSizeValue(true)).toEqual(defaultPageSize);
    });

    it('should return default pageSize when pageSize parameter is array', async () => {
      expect(normalizePageSizeValue([])).toEqual(defaultPageSize);
    });

    it('should return default pageSize when pageSize parameter is object', async () => {
      expect(normalizePageSizeValue({})).toEqual(defaultPageSize);
    });
  });
});
