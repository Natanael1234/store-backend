import { UserMessage } from './user.messages.enum';

describe('UserMessage', () => {
  it('should be defined', () => {
    expect(UserMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...UserMessage }).toEqual({
      NOT_FOUND: 'User not found',
      DATA_REQUIRED: 'User data required',
      REQUIRED: 'User required',
      ID_REQUIRED: 'User id is required',

      // user id
      REQUIRED_USER_ID: 'User id is required',
      USER_ID_TYPE: 'User id should be integer or equal 1',
      INVALID_USER_ID: 'Invalid user id',
      NULL_USER_ID: 'Null user id',
    });
  });
});
