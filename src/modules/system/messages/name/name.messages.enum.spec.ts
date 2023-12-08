import { NameMessage } from './name.messages.enum';

describe('NameMessage', () => {
  it('should be defined', () => {
    expect(NameMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...NameMessage }).toEqual({
      INVALID: 'Invalid name',
      STRING: 'Name should be string',
      NULL: 'Null name',
      REQUIRED: 'Name is required',
      MIN_LEN: 'Name should be at least 6 characters long',
      MAX_LEN: 'Name should have a maximum of 60 characters',
    });
  });
});
