import { Repository } from 'typeorm';
import { Role } from '../../modules/authentication/enums/role/role.enum';
import { EncryptedDataDto } from '../../modules/system/encryption/dtos/encrypted-data.dto';
import { EncryptionService } from '../../modules/system/encryption/services/encryption/encryption.service';
import { User } from '../../modules/user/models/user/user.entity';

type ExpectedUserData = {
  name: string;
  email: string;
  roles: Role[];
  active: boolean;
  created?: Date;
  updated?: Date;
  deletedAt?: Date;
};

export function testValidateUser(user: User, expectedData: ExpectedUserData) {
  expect(user).toBeDefined();
  // expect(user).toBeInstanceOf(User);
  expect(user.id).toBeDefined();
  expect(expectedData['id']).not.toBeDefined(); // TODO: remover depois de passar todos os testes
  expect(typeof user.id).toEqual('string');
  expect(user.name).toEqual(expectedData.name);
  expect(user.email).toEqual(expectedData.email);
  expect(user['password']).toBeUndefined();
  expect(user['hash']).toBeUndefined();
  expect(user.created).toBeDefined();
  expect(user.updated).toBeDefined();
  expect(user.deletedAt).toBeNull();
  expect(user.roles).toBeDefined();
  expect(user.roles).toEqual(expectedData.roles);
  expect(user.active).toEqual(expectedData.active);
  expect(Object.keys(user)).toEqual([
    'id',
    'name',
    'email',
    'roles',
    'active',
    'created',
    'updated',
    'deletedAt',
  ]);
}

export function testValidateUsers(
  users: User[],
  expectedData: ExpectedUserData[],
) {
  expect(users).toBeDefined();
  expect(users.length).toEqual(expectedData.length);

  const ids = users.map((u) => u.id);
  const nonRepeatedIds = [...new Set(ids)];
  expect(nonRepeatedIds).toHaveLength(ids.length);

  for (let i = 0; i < users.length; i++) {
    testValidateUser(users[i], expectedData[i]);
  }
}

type UserWithHash = {
  id: string;
  name: string;
  email: string;
  hash: EncryptedDataDto;
  roles: Role[];
  active: boolean;
  created?: Date;
  updated?: Date;
  deletedAt?: Date;
};

type ExpectedUserDataWithPassword = {
  name: string;
  email: string;
  password: string;
  roles: Role[];
  active: boolean;
  // created?: Date;
  // updated?: Date;
  // deletedAt?: Date;
  deleted?: boolean;
};

export async function testValidateUserWithPassword(
  user: UserWithHash,
  expectedData: ExpectedUserDataWithPassword,
  encryptionService: EncryptionService,
) {
  expect(user).toBeDefined();
  // expect(user).toBeInstanceOf(User);
  expect(expectedData['id']).not.toBeDefined(); // TODO: remover depois de passar todos os testes
  expect(user.id).toBeDefined();
  expect(typeof user.id).toEqual('string');
  expect(user.name).toEqual(expectedData.name);
  expect(user.email).toEqual(expectedData.email);
  expect(user['password']).toBeUndefined();
  expect(user.hash).toBeDefined();
  const decriptedPassword = await encryptionService.decrypt(user.hash);
  expect(decriptedPassword).toEqual(expectedData.password);
  expect(user.created).toBeDefined();
  expect(user.updated).toBeDefined();
  if (expectedData.deleted) {
    expect(user.deletedAt).toBeDefined();
  } else {
    expect(user.deletedAt).toBeNull();
  }
  expect(user.roles).toBeDefined();
  expect(user.roles).toEqual(expectedData.roles);
  expect(user.active).toEqual(expectedData.active);
  expect(Object.keys(user)).toEqual([
    'id',
    'name',
    'email',
    'hash',
    'roles',
    'active',
    'created',
    'updated',
    'deletedAt',
  ]);
}

export async function testValidateUsersWithPassword(
  users: UserWithHash[],
  expectedData: ExpectedUserDataWithPassword[],
  encryptionService: EncryptionService,
) {
  expect(users).toBeDefined();
  expect(users.length).toEqual(expectedData.length);

  const ids = users.map((u) => u.id);
  const nonRepeatedIds = [...new Set(ids)];
  expect(nonRepeatedIds).toHaveLength(ids.length);

  for (let i = 0; i < users.length; i++) {
    await testValidateUserWithPassword(
      users[i],
      expectedData[i],
      encryptionService,
    );
  }
}

export type TestUserInsertParams = {
  name: string;
  email: string;
  password: string;
  active?: boolean;
  roles: Role[];
  deletedAt?: Date;
};

export async function testInsertUsers(
  userRepo: Repository<User>,
  encryptionService: EncryptionService,
  users: TestUserInsertParams[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const user of users) {
    const ret = await userRepo
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        name: user.name,
        email: user.email,
        hash: await encryptionService.encrypt(user.password),
        roles: user.roles,
        active: user.active,
        deletedAt: user.deletedAt,
      })
      .execute();
    ids.push(ret.identifiers[0].id);
  }
  return ids;
}
