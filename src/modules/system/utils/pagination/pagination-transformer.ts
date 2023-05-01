import { plainToInstance } from 'class-transformer';
import { PaginationRequestDTO } from '../../dtos/request/pagination/pagination.request.dto';
import { validateOrThrowError } from '../validation';

const defaultPageSize = 12;

export function transformPaginationForQuery(
  page: number,
  pageSize: number,
): {
  take: number;
  skip: number;
} {
  if (!page || page < 1) page = 1;
  if (!pageSize || pageSize < 1) pageSize = defaultPageSize;
  const skip = pageSize * (page - 1);
  const take = pageSize;
  return { take, skip };
}

export async function transformPaginationForQueryOrThrows(
  pagination?: PaginationRequestDTO,
  pageSize?: number,
): Promise<{ take: number; skip: number }> {
  if (!pageSize || pageSize < 1) pageSize = defaultPageSize;
  if (!pagination) {
    pagination = plainToInstance(PaginationRequestDTO, { page: 1 });
  }
  await validateOrThrowError(pagination, PaginationRequestDTO);
  const paginationForQuery = transformPaginationForQuery(
    pagination?.page,
    pageSize,
  );
  return paginationForQuery;
}
