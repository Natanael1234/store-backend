import { DeleteMessage } from './delete.messages.enum';

describe('DeleteMessage', () => {
  it('should be defined', () => {
    expect(DeleteMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...DeleteMessage }).toEqual({
      REQUIRED: 'Delete is required',
      TYPE: 'Delete should be boolean',
      INVALID: 'Delete is invalid',
    });
  });
});
