export enum RefreshTokenMessage {
  REQUIRED = 'Refresh token is required',
  STRING = 'Refresh token should be string',
  INVALID = 'Invalid refresh token',
  MALFORMED = 'Malformed refresh token',
  REVOKED = 'Revoked refresh token',
  EXPIRED = 'Expired refresh token',
  NOT_FOUND = 'Refresh token not found',
  PAYLOAD_REQUIRED = 'Refresh token payload is required',
}
