import { ModelMessage } from './model-messages.enum';

describe('ProductModelMessage', () => {
  it('should be defined', () => {
    expect(ModelMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ModelMessage }).toEqual({
      STRING: 'Model must be string',
      REQUIRED: 'Model is required',
      MIN_LEN: 'Model must be at least 6 characters long',
      MAX_LEN: 'Model must have a maximum of 60 characters',
    });
  });
});
