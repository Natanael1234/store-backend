import { ActiveFilter } from './active-filter.enum';

describe('ActiveFilter', () => {
  it('should be defined', () => {
    expect(ActiveFilter).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ActiveFilter }).toEqual({
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      ALL: 'all',
    });
  });
});
