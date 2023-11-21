import { CredentialsMessage } from './credentials.messages.enum';

describe('CredentialsMessage', () => {
  it('should be defined', () => {
    expect(CredentialsMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...CredentialsMessage }).toEqual({
      INVALID: 'Invalid credentials',
      REQUIRED: 'Credentials required',
    });
  });
});
