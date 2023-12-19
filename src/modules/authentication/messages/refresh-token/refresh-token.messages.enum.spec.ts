import { RefreshTokenMessage } from './refresh-token.messages.enum';

describe('RefreshTokenMessage', () => {
  it('should be defined', () => {
    expect(RefreshTokenMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...RefreshTokenMessage }).toEqual({
      REQUIRED: 'Refresh token is required',
      STRING: 'Refresh token should be string',
      INVALID: 'Invalid refresh token',
      MALFORMED: 'Malformed refresh token',
      REVOKED: 'Revoked refresh token',
      EXPIRED: 'Expired refresh token',
      NOT_FOUND: 'Refresh token not found',
      PAYLOAD_REQUIRED: 'Refresh token payload is required',
    });
  });
});
