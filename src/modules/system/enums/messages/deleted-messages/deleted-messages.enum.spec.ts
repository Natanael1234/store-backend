import { DeletedMessage } from './deleted-messages.enum';

describe('ActiveMessage', () => {
  it('should be defined', () => {
    expect(DeletedMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...DeletedMessage }).toEqual({
      REQUIRED: 'Deleted is required',
      BOOLEAN: 'Deleted must be boolean',
      INVALID: 'Deleted is invalid',
    });
  });
});
