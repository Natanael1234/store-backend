import { ModelMessage } from './model.messages.enum';

describe('ProductModelMessage', () => {
  it('should be defined', () => {
    expect(ModelMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ModelMessage }).toEqual({
      STRING: 'Model should be string',
      REQUIRED: 'Model is required',
      MIN_LEN: 'Model should be at least 6 characters long',
      MAX_LEN: 'Model should have a maximum of 60 characters',
    });
  });
});
