import { AuthorizationMessage } from './authorization-messages.enum';

describe('AuthorizationMessage', () => {
  it('should be defined', () => {
    expect(AuthorizationMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...AuthorizationMessage }).toEqual({
      NOT_AUTORIZED: 'Not authorized',
      REQUIRED: 'Roles is required',
      INVALID: 'Invalid role',
    });
  });
});
