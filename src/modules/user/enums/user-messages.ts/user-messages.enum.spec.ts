import { UserMessage as UserMessage } from './user-messages.enum';

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
    });
  });
});
