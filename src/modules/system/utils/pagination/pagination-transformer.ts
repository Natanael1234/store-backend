import { PaginationConfig } from '../../dtos/request/pagination/configs/pagination.config';

function limitValue(value: any, min: number, max?: number): any {
  if (typeof value != 'number') return value;
  if (min != null) {
    value = Math.max(min, value);
  }
  if (max != null) {
    value = Math.min(max, value);
  }
  return value;
}

function valueToNumber(
  value,
  defaultValue: number,
  min: number,
  max?: number,
): number {
  if (value === null || value === undefined) {
    return limitValue(defaultValue, min, max);
  } else if (Number.isInteger(value)) {
    return limitValue(value, min, max);
  } else if (typeof value == 'number') {
    return value;
  } else if (typeof value == 'string') {
    const num = Number(value);
    if (!isNaN(num) && Number.isInteger(num)) {
      return limitValue(num, min, max);
    } else if (!isNaN(num)) {
      return num;
    }
  }
  return NaN;
}

export function normalizePageValue(value: any) {
  return valueToNumber(
    value,
    PaginationConfig.DEFAULT_PAGE,
    PaginationConfig.MIN_PAGE,
  );
}

export function normalizePageSizeValue(value: any) {
  return valueToNumber(
    value,
    PaginationConfig.DEFAULT_PAGE_SIZE,
    PaginationConfig.MIN_PAGE_SIZE,
    PaginationConfig.MAX_PAGE_SIZE,
  );
}

export function normalizePaginationSkip(page: any, pageSize: any) {
  pageSize = normalizePageSizeValue(pageSize);
  if (pageSize == null || Number.isNaN(pageSize)) return NaN;
  page = normalizePageValue(page);
  if (page == null || Number.isNaN(page)) return NaN;
  const skip = (page - 1) * pageSize;
  return skip == 0 ? 0 : skip;
}

export function normalizePaginationTake(pageSize: any) {
  return normalizePageSizeValue(pageSize);
}
