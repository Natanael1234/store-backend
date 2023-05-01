import { HttpStatus } from '@nestjs/common';

type CreateViaRepositotyCallback<T> = (textToAppend: string[]) => Promise<any>;

type GetPagesFromRepositoryCallback<T> = (options: {
  query?: string;
}) => Promise<[pages: T[], count: number]>;

type GetPagesFromAPICallback<T> = (
  queryParameters: { query?: any },
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

const textsToAppend = [];
for (let i = 0; i < 15; i++) {
  textsToAppend.push(i % 2 == 0 ? ' EVEN' : ' ODD');
}

export function testTextFilter<T>(
  createViaRepository: CreateViaRepositotyCallback<T>,
  getPagesFromRepository: GetPagesFromRepositoryCallback<T>,
  getPagesFromAPI: GetPagesFromAPICallback<T>,
) {
  it('should filter by text', async () => {
    await createViaRepository(textsToAppend);
    const [results, count] = await getPagesFromRepository({ query: 'EVEN' });
    const ret = await getPagesFromAPI({ query: 'EVEN' }, HttpStatus.OK);
    expect(ret).toEqual({
      count: 8,
      page: 1,
      pageSize: 12,
      results: objectToJSON(results),
    });
  });

  it('should filter by text with no results', async () => {
    await createViaRepository(textsToAppend);
    const [results, count] = await getPagesFromRepository({
      query: 'NOT FOUND',
    });
    const ret = await getPagesFromAPI({ query: 'NOT FOUND' }, HttpStatus.OK);
    expect(ret).toEqual({
      count: 0,
      page: 1,
      pageSize: 12,
      results: [],
    });
  });

  it('should filter by text in empty table with no results', async () => {
    const ret = await getPagesFromAPI({ query: 'EVEN' }, HttpStatus.OK);
    expect(ret).toEqual({
      count: 0,
      page: 1,
      pageSize: 12,
      results: [],
    });
  });

  it('should not filter by text when query is not defined', async () => {
    await createViaRepository(textsToAppend);
    const [results, count] = await getPagesFromRepository({});
    const ret = await getPagesFromAPI({}, HttpStatus.OK);
    expect(ret).toEqual({
      count: 15,
      page: 1,
      pageSize: 12,
      results: objectToJSON(results),
    });
  });

  it('should not filter by text when query is empty', async () => {
    await createViaRepository(textsToAppend);
    const [results, count] = await getPagesFromRepository({});
    const ret = await getPagesFromAPI({ query: '' }, HttpStatus.OK);
    expect(ret).toEqual({
      count: 15,
      page: 1,
      pageSize: 12,
      results: objectToJSON(results),
    });
  });

  it('should not filter by text when query is made only of spaces', async () => {
    await createViaRepository(textsToAppend);
    const [results, count] = await getPagesFromRepository({});
    const ret = await getPagesFromAPI({ query: '    ' }, HttpStatus.OK);
    expect(ret).toEqual({
      count: 15,
      page: 1,
      pageSize: 12,
      results: objectToJSON(results),
    });
  });

  it('should ignore spaces', async () => {
    await createViaRepository(textsToAppend);
    const [results, count] = await getPagesFromRepository({ query: 'EVEN' });
    const ret = await getPagesFromAPI({ query: '  EV   N' }, HttpStatus.OK);
    expect(ret).toEqual({
      count: 8,
      page: 1,
      pageSize: 12,
      results: objectToJSON(results),
    });
  });

  it('should ignore case', async () => {
    await createViaRepository(textsToAppend);
    const [results, count] = await getPagesFromRepository({ query: 'EVEN' });
    const ret = await getPagesFromAPI({ query: 'eVEN' }, HttpStatus.OK);
    expect(ret).toEqual({
      count: 8,
      page: 1,
      pageSize: 12,
      results: objectToJSON(results),
    });
  });
}
