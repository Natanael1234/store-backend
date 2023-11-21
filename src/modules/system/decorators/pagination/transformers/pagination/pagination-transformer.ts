import { PaginationConfigs } from '../../../../configs/pagination/pagination.configs';

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
  }
  return limitValue(defaultValue, min, max);
}

export function normalizePageValue(value: any) {
  return valueToNumber(
    value,
    PaginationConfigs.DEFAULT_PAGE,
    PaginationConfigs.MIN_PAGE,
  );
}

export function normalizePageSizeValue(value: any) {
  return valueToNumber(
    value,
    PaginationConfigs.DEFAULT_PAGE_SIZE,
    PaginationConfigs.MIN_PAGE_SIZE,
    PaginationConfigs.MAX_PAGE_SIZE,
  );
}
