import { Repository } from 'typeorm';
import { UserEntity } from '../modules/user/models/user/user.entity';
import { TestUserData } from './test-user-data';

export function testValidateUser(user, expectedData) {
  expect(user).toBeDefined();
  // expect(user).toBeInstanceOf(UserEntity);
  expect(user.id).toEqual(expectedData.id);
  expect(user.name).toEqual(expectedData.name);
  expect(user.email).toEqual(expectedData.email);
  expect(user.password).toBeUndefined();
  expect(user.hash).toBeUndefined();
  expect(user.created).toBeDefined();
  expect(user.updated).toBeDefined();
  expect(user.deletedAt).toBeNull();
  expect(user.roles).toBeDefined();
  expect(user.roles).toEqual(expectedData.roles);
  expect(Object.keys(user)).toEqual([
    'id',
    'name',
    'email',
    'roles',
    'created',
    'updated',
    'deletedAt',
  ]);
}

export async function testCreateUser(
  userRepo: Repository<UserEntity>,
  createCallback: (userDada: any) => Promise<UserEntity>,
) {
  const creationData = TestUserData.userCreationData;

  try {
    const createdUsers = [
      await createCallback(creationData[0]),
      await createCallback(creationData[1]),
      await createCallback(creationData[2]),
    ];

    const expectedData = [
      { id: 1, ...creationData[0] },
      { id: 2, ...creationData[1] },
      { id: 3, ...creationData[2] },
    ];
    expectedData.forEach((data) => delete data.password);

    const users = await userRepo.find();

    expect(users).toHaveLength(3);

    testValidateUser(createdUsers[0], expectedData[0]);
    testValidateUser(createdUsers[1], expectedData[1]);
    testValidateUser(createdUsers[2], expectedData[2]);

    testValidateUser(users[0], expectedData[0]);
    testValidateUser(users[1], expectedData[1]);
    testValidateUser(users[2], expectedData[2]);
  } catch (error) {
    throw error;
  }
}

export async function testUpdateUser(
  userRepo: Repository<UserEntity>,
  updateCallback: (userId: number, userDada: any) => Promise<UserEntity>,
) {
  const usersData = TestUserData.usersData();
  let name = 'New Name';
  let email = 'newname@email.com';
  let updateData = { name, email };
  let expectedUpdateData = [
    { id: 1, ...usersData[0] },
    { id: 2, ...usersData[1], name, email },
    { id: 3, ...usersData[2] },
  ];
  await userRepo.insert(userRepo.create(usersData[0]));
  await userRepo.insert(userRepo.create(usersData[1]));
  await userRepo.insert(userRepo.create(usersData[2]));

  const retUpdate = await updateCallback(2, updateData);
  const users = await userRepo.find();

  expect(users).toHaveLength(3);
  testValidateUser(retUpdate, expectedUpdateData[1]);
  testValidateUser(users[0], expectedUpdateData[0]);
  testValidateUser(users[1], expectedUpdateData[1]);
  testValidateUser(users[2], expectedUpdateData[2]);
}

export async function testFindUsers(
  userRepo: Repository<UserEntity>,
  findCallback: () => Promise<UserEntity[]>,
) {
  const createData = TestUserData.usersData();
  const createdUSers = [
    userRepo.create(createData[0]),
    userRepo.create(createData[1]),
    userRepo.create(createData[2]),
  ];
  await userRepo.save(createdUSers[0]);
  await userRepo.save(createdUSers[1]);
  await userRepo.save(createdUSers[2]);
  const users = await findCallback();
  expect(Array.isArray(users)).toBe(true);
  expect(users).toHaveLength(3);
  const expectedData = [
    { id: 1, ...createData[0] },
    { id: 2, ...createData[1] },
    { id: 3, ...createData[2] },
  ];
  expectedData.forEach((data) => delete data.password);

  testValidateUser(users[0], expectedData[0]);
  testValidateUser(users[1], expectedData[1]);
  testValidateUser(users[2], expectedData[2]);
}

export async function testFindUserForId(
  userRepo: Repository<UserEntity>,
  findForIdCallback: (userId: number) => Promise<UserEntity>,
) {
  const usersData = TestUserData.usersData();
  const expectedData = { id: 2, ...usersData[1] };
  const createdUsers = [
    userRepo.create(usersData[0]),
    userRepo.create(usersData[1]),
    userRepo.create(usersData[2]),
  ];
  await userRepo.save(createdUsers[0]);
  await userRepo.save(createdUsers[1]);
  await userRepo.save(createdUsers[2]);
  const foundUser = await findForIdCallback(2);

  testValidateUser(foundUser, expectedData);
}
