import { NameMessage } from './name-messages.enum';

describe('NameMessage', () => {
  it('should be defined', () => {
    expect(NameMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...NameMessage }).toEqual({
      STRING: 'Name must be string',
      REQUIRED: 'Name is required',
      MIN_LEN: 'Name must be at least 6 characters long',
      MAX_LEN: 'Name must have a maximum of 60 characters',
    });
  });
});
