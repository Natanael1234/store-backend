import { CodeMessage } from './code-messages.enum';

describe('ProductCodeMessage', () => {
  it('should be defined', () => {
    expect(CodeMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...CodeMessage }).toEqual({
      STRING: 'Code must be string',
      REQUIRED: 'Code is required',
      MIN_LEN: 'Code must be at least 6 characters long',
      MAX_LEN: 'Code must have a maximum of 60 characters',
    });
  });
});
