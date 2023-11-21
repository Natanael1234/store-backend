import { SortMessage } from './sort.messages.enum';

describe('SortMessage', () => {
  it('should be defined', () => {
    expect(SortMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...SortMessage }).toEqual({
      INVALID: 'Invalid sort parameters',
      REPEATED: 'Repeated sort parameters',
    });
  });
});
