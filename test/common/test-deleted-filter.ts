import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { DeletedFilter } from '../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { DeletedMessage } from '../../src/modules/system/enums/messages/deleted-messages/deleted-messages.enum';

type CreateViaRepositotyCallback<T> = (
  quantity: number,
  deletedIds: number[],
) => Promise<any>;

type GetPagesFromRepositoryCallback<T> = (options: {
  deleted?: boolean;
}) => Promise<[pages: T[], count: number]>;

type GetPagesFromAPICallback<T> = (
  queryParameters: {
    deleted?: any;
  },
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

export function testDeletedFilter<T>(
  createViaRepository: CreateViaRepositotyCallback<T>,
  getPagesFromRepository: GetPagesFromRepositoryCallback<T>,
  getPagesFromAPI: GetPagesFromAPICallback<T>,
) {
  it('should return not deleted results when "deleted" parameter is not defined', async () => {
    await createViaRepository(15, [2, 13]);
    const [registers] = await getPagesFromRepository({ deleted: false });
    const ret = await getPagesFromAPI({}, HttpStatus.OK);
    expect(ret).toEqual({
      count: 13,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should return not deleted results when deleted parameter is equal to "not_deleted"', async () => {
    await createViaRepository(15, [2, 13]);
    const [registers] = await getPagesFromRepository({ deleted: false });
    const ret = await getPagesFromAPI(
      { deleted: DeletedFilter.NOT_DELETED },
      HttpStatus.OK,
    );
    expect(ret).toEqual({
      count: 13,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should return deleted when deleted parameter is equal to "not deleted"', async () => {
    await createViaRepository(15, [1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15]);
    const [registers] = await getPagesFromRepository({ deleted: true });
    const ret = await getPagesFromAPI(
      { deleted: DeletedFilter.DELETED },
      HttpStatus.OK,
    );
    expect(ret).toEqual({
      count: 13,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should return both deleted and not deleted when deleted parameter is equal to "all"', async () => {
    await createViaRepository(15, [2, 13]);
    const [registers] = await getPagesFromRepository({});
    const ret = await getPagesFromAPI(
      { deleted: DeletedFilter.ALL },
      HttpStatus.OK,
    );
    expect(ret).toEqual({
      count: 15,
      page: 1,
      pageSize: 12,
      results: objectToJSON(registers),
    });
  });

  it('should fail when deleted parameter is invalid', async () => {
    const ret = await getPagesFromAPI(
      { deleted: 'invalid' },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(ret).toEqual({
      error: UnprocessableEntityException.name,
      message: { deleted: DeletedMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
}
