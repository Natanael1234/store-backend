import { PasswordMessage } from './password-messages.enum';

describe('PasswordMessage', () => {
  it('should be defined', () => {
    expect(PasswordMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...PasswordMessage }).toEqual({
      STRING: 'Password must be string',
      REQUIRED: 'Password is required',
      MIN_LEN: 'Password must be at least 6 characters long',
      MAX_LEN: 'Password must have a maximum of 12 characters',
      INVALID:
        'Password must have lowercase, uppercase, number and special characters',
    });
  });
});
