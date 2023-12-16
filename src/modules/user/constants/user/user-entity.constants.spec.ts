import { testConvertStaticPropertiesToObject } from '../../../../test/test-utils';
import { UserConstants } from './user-entity.constants';

describe('UserConstants', () => {
  it('should de defined', () => {
    expect(UserConstants).toBeDefined();
  });

  it('sohuld have correct properties', () => {
    const values = testConvertStaticPropertiesToObject(UserConstants);
    expect(values).toEqual({
      USER: 'user',
      USERS: 'users',

      USER_ID: 'user.id',
      USER_NAME: 'user.name',
      USER_EMAIL: 'user.email',
      USER_HASH: 'user.hash',
      USER_ACTIVE: 'user.active',
      USER_CREATED: 'user.created',
      USER_UPDATED: 'user.updated',
      USER_DELETED_AT: 'user.deletedAt',

      ID: 'id',
      NAME: 'name',
      EMAIL: 'email',
      HASH: 'hash',
      ACTIVE: 'active',
      CREATED: 'created',
      UPDATED: 'updated',
      DELETED_AT: 'deletedAt',

      USER_ID_EQUALS_TO: `user.id = :userId`,
      USER_EMAIL_EQUALS_TO: `user.email = :email`,
      USER_NAME_EQUALS_TO: `user.name = :name`,
      USER_NAME_LIKE_TEXT_QUERY: `LOWER(user.name) LIKE :textQuery`,
      USER_ACTIVE_EQUALS_TO: `user.active = :isActiveUser`,
      USER_DELETED_AT_IS_NULL: `user.deletedAt IS NULL`,
      USER_DELETED_AT_IS_NOT_NULL: `user.deletedAt IS NOT NULL`,

      ID_EQUALS_TO: `id = :userId`,
      EMAIL_EQUALS_TO: `email = :email`,
      NAME_EQUALS_TO: `name = :name`,
      DELETED_AT_IS_NULL: `user.deletedAt IS NULL`,
      ACTIVE_EQUALS_TO: `active = :active`,
    });
  });
});
