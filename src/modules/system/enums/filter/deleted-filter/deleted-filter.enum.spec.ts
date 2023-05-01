import { DeletedFilter } from './deleted-filter.enum';

describe('DeletedFilter', () => {
  it('should be defined', () => {
    expect(DeletedFilter).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...DeletedFilter }).toEqual({
      NOT_DELETED: 'not_deleted',
      DELETED: 'deleted',
      ALL: 'all',
    });
  });
});
