import { transformPaginationForQuery } from './pagination-transformer';

describe('transformPaginationForQuery', () => {
  it('should be defined', () => {
    expect(transformPaginationForQuery).toBeDefined();
  });

  it.each([
    { parameters: {} },
    { parameters: { page: null, pageSize: null } },
    { parameters: { page: undefined, pageSize: undefined } },
    { parameters: { page: null, pageSize: 12 } },
    { parameters: { page: 1, pageSize: null } },
    { parameters: { page: 1, pageSize: 12 } },
  ])(
    'should return { skip: 0, take: 12 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 0,
        take: 12,
      });
    },
  );

  it.each([
    { parameters: { page: 2 } },
    { parameters: { page: 2, pageSize: null } },
    { parameters: { page: 2, pageSize: undefined } },
    { parameters: { page: 2, pageSize: 12 } },
  ])(
    'should return { skip: 0, take: 12 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 12,
        take: 12,
      });
    },
  );

  it.each([
    { parameters: { page: 2 } },
    { parameters: { page: 2, pageSize: null } },
    { parameters: { page: 2, pageSize: undefined } },
    { parameters: { page: 2, pageSize: 12 } },
  ])(
    'should return { skip: 12, take: 12 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 12,
        take: 12,
      });
    },
  );

  it.each([{ parameters: { page: 2, pageSize: 10 } }])(
    'should return { skip: 10, take: 10 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 10,
        take: 10,
      });
    },
  );

  it.each([
    { parameters: { pageSize: 10 } },
    { parameters: { page: null, pageSize: 10 } },
    { parameters: { page: undefined, pageSize: 10 } },
    { parameters: { page: null, pageSize: 10 } },
    { parameters: { page: 1, pageSize: 10 } },
    { parameters: { page: 1, pageSize: 10 } },
  ])(
    'should return { skip: 0, take: 10 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 0,
        take: 10,
      });
    },
  );
});

describe('transformPaginationOrThrows', () => {
  it('should be defined', () => {
    expect(transformPaginationForQuery).toBeDefined();
  });

  it.each([
    { parameters: {} },
    { parameters: { page: null, pageSize: null } },
    { parameters: { page: undefined, pageSize: undefined } },
    { parameters: { page: null, pageSize: 12 } },
    { parameters: { page: 1, pageSize: null } },
    { parameters: { page: 1, pageSize: 12 } },
  ])(
    'should return { skip: 0, take: 12 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 0,
        take: 12,
      });
    },
  );

  it.each([
    { parameters: { page: 2 } },
    { parameters: { page: 2, pageSize: null } },
    { parameters: { page: 2, pageSize: undefined } },
    { parameters: { page: 2, pageSize: 12 } },
  ])(
    'should return { skip: 0, take: 12 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 12,
        take: 12,
      });
    },
  );

  it.each([
    { parameters: { page: 2 } },
    { parameters: { page: 2, pageSize: null } },
    { parameters: { page: 2, pageSize: undefined } },
    { parameters: { page: 2, pageSize: 12 } },
  ])(
    'should return { skip: 12, take: 12 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 12,
        take: 12,
      });
    },
  );

  it.each([{ parameters: { page: 2, pageSize: 10 } }])(
    'should return { skip: 10, take: 10 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 10,
        take: 10,
      });
    },
  );

  it.each([
    { parameters: { pageSize: 10 } },
    { parameters: { page: null, pageSize: 10 } },
    { parameters: { page: undefined, pageSize: 10 } },
    { parameters: { page: null, pageSize: 10 } },
    { parameters: { page: 1, pageSize: 10 } },
    { parameters: { page: 1, pageSize: 10 } },
  ])(
    'should return { skip: 0, take: 10 } when parameters=$parameters',
    ({ parameters }) => {
      const { page, pageSize } = parameters;
      expect(transformPaginationForQuery(page, pageSize)).toEqual({
        skip: 0,
        take: 10,
      });
    },
  );
});
