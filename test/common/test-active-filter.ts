import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { ActiveFilter } from '../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { ActiveMessage } from '../../src/modules/system/enums/messages/active-messages/active-messages.enum';

type CreateViaRepositotyCallback<T> = (
  quantity: number,
  inactiveIds: number[],
) => Promise<any>;

type GetPagesFromRepositoryCallback<T> = (options: {
  active?: boolean;
}) => Promise<[pages: T[], count: number]>;

type GetPagesFromAPICallback<T> = (
  queryParameters: { active?: any },
  httpStatus: number,
) => Promise<{
  count: number;
  page: number;
  pageSize: number;
  results: T[];
}>;

function objectToJSON(object) {
  return JSON.parse(JSON.stringify(object));
}

export function testActiveFilter<T>(
  createViaRepository: CreateViaRepositotyCallback<T>,
  getPagesFromRepository: GetPagesFromRepositoryCallback<T>,
  getPagesFromAPI: GetPagesFromAPICallback<T>,
) {
  it('should return active results when "active" parameter is not defined', async () => {
    await createViaRepository(15, [2, 13]);
    const [registers] = await getPagesFromRepository({ active: true });
    const ret = await getPagesFromAPI({}, HttpStatus.OK);
    expect(ret).toEqual({
      count: 13,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should return active results when active parameter is equal to "active"', async () => {
    await createViaRepository(15, [2, 13]);
    const [registers] = await getPagesFromRepository({ active: true });
    const ret = await getPagesFromAPI(
      { active: ActiveFilter.ACTIVE },
      HttpStatus.OK,
    );
    expect(ret).toEqual({
      count: 13,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should return inactive results when active parameter is equal to "inactive"', async () => {
    await createViaRepository(15, [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15]);
    const [registers] = await getPagesFromRepository({ active: false });
    const ret = await getPagesFromAPI(
      { active: ActiveFilter.INACTIVE },
      HttpStatus.OK,
    );
    expect(ret).toEqual({
      count: 13,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should return both active and inactive results when active parameter is equal to "all"', async () => {
    await createViaRepository(15, [2, 13]);
    const [registers] = await getPagesFromRepository({});
    const ret = await getPagesFromAPI(
      { active: ActiveFilter.ALL },
      HttpStatus.OK,
    );
    expect(ret).toEqual({
      count: 15,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should fail when active parameter is invalid', async () => {
    const ret = await getPagesFromAPI(
      { active: 'invalid' },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(ret).toEqual({
      error: UnprocessableEntityException.name,
      message: { active: ActiveMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
}
