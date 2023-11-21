import { RoleMessage } from './role.messages.enum';

describe('RoleMessage', () => {
  it('should be defined', () => {
    expect(RoleMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...RoleMessage }).toEqual({
      INVALID: 'Roles should be an array of roles',
      REQUIRED: 'Roles is required',
      ITEM_MUST_BE_DEFINED: 'Role items should be defined',
      MIN_LEN: 'Roles should have at least one role',
    });
  });
});
