import { AccessTokenMessage } from './access-token-messages.enum';

describe('AccessTokenMessage', () => {
  it('should be defined', () => {
    expect(AccessTokenMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...AccessTokenMessage }).toEqual({
      REQUIRED: 'Access token is required',
      STRING: 'Access token must be string',
      INVALID: 'Invalid access token',
      MALFORMED: 'Malformed access token',
      REVOKED: 'Revoked access token',
      EXPIRED: 'Expired access token',
      NOT_FOUND: 'Access token not found',
    });
  });
});
