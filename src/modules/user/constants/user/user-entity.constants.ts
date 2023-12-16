export class UserConstants {
  static readonly USER = 'user';
  static readonly USERS = 'users';

  static readonly USER_ID = 'user.id';
  static readonly USER_NAME = 'user.name';
  static readonly USER_EMAIL = 'user.email';
  static readonly USER_HASH = 'user.hash';
  static readonly USER_ACTIVE = 'user.active';
  static readonly USER_CREATED = 'user.created';
  static readonly USER_UPDATED = 'user.updated';
  static readonly USER_DELETED_AT = 'user.deletedAt';

  static readonly ID = 'id';
  static readonly NAME = 'name';
  static readonly EMAIL = 'email';
  static readonly HASH = 'hash';
  static readonly ACTIVE = 'active';
  static readonly CREATED = 'created';
  static readonly UPDATED = 'updated';
  static readonly DELETED_AT = 'deletedAt';

  static readonly USER_ID_EQUALS_TO = `user.id = :userId`;
  static readonly USER_EMAIL_EQUALS_TO = `user.email = :email`;
  static readonly USER_NAME_EQUALS_TO = `user.name = :name`;
  static readonly USER_NAME_LIKE_TEXT_QUERY = `LOWER(user.name) LIKE :textQuery`;
  static readonly USER_ACTIVE_EQUALS_TO = `user.active = :isActiveUser`;
  static readonly USER_DELETED_AT_IS_NULL = `user.deletedAt IS NULL`;
  static readonly USER_DELETED_AT_IS_NOT_NULL = `user.deletedAt IS NOT NULL`;

  static readonly ID_EQUALS_TO = `id = :userId`;
  static readonly EMAIL_EQUALS_TO = `email = :email`;
  static readonly NAME_EQUALS_TO = `name = :name`;
  static readonly DELETED_AT_IS_NULL = `user.deletedAt IS NULL`;
  static readonly ACTIVE_EQUALS_TO = `active = :active`;
}
