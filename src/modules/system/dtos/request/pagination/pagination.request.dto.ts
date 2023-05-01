import { Expose, Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { PaginationMessage } from '../../../enums/messages/pagination-messages/pagination-messages.enum';
import { PaginationConfig } from './configs/pagination.config';

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
  } else if (typeof value == 'string') {
    const num = Number(value);
    if (!isNaN(num) && Number.isInteger(num)) {
      return limitValue(num, min, max);
    }
  }
  return value;
}

function normalizePageValue(value: number) {
  return valueToNumber(
    value,
    PaginationConfig.DEFAULT_PAGE,
    PaginationConfig.MIN_PAGE,
  );
}

function normalizePageSizeValue(value: number) {
  return valueToNumber(
    value,
    PaginationConfig.DEFAULT_PAGE_SIZE,
    PaginationConfig.MIN_PAGE_SIZE,
    PaginationConfig.MAX_PAGE_SIZE,
  );
}

export class PaginationRequestDTO {
  @IsInt({ message: PaginationMessage.PAGE_INT })
  @Transform((options) => normalizePageValue(options.obj.page))
  @Expose()
  page?: number;

  @IsInt({ message: PaginationMessage.PAGE_SIZE_INT })
  @Transform((options) => normalizePageSizeValue(options.obj.pageSize))
  @Expose()
  pageSize?: number;

  @Transform((options) => {
    const pageSize = normalizePageSizeValue(options.obj.pageSize);
    if (pageSize == null) return;
    const page = normalizePageValue(options.obj.page);
    if (page == null) return;
    return (page - 1) * pageSize;
  })
  @Expose()
  skip?: number;

  @Transform((options) => normalizePageSizeValue(options.obj.pageSize))
  @Expose()
  take?: number;
}
