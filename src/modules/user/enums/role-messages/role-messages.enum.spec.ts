import { RoleMessage } from './role-messages.enum';

describe('RoleMessage', () => {
  it('should be defined', () => {
    expect(RoleMessage).toBeDefined();
  });

  it('should have valid keys amd values', () => {
    expect({ ...RoleMessage }).toEqual({
      INVALID: 'Roles must be an array of roles',
      REQUIRED: 'Roles is required',
      ITEM_MUST_BE_DEFINED: 'Role items must be defined',
      MIN_LEN: 'Roles must have at least one role',
    });
  });
});
