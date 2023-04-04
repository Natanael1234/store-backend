import { Repository } from 'typeorm';
import { UserEntity } from './models/user/user.entity';

export const usersData = [
  {
    name: 'User 1',
    email: 'user1@email.com',
    password: 'Ab123*',
    hash: { iv: '', encryptedData: '' },
  },
  {
    name: 'User 2',
    email: 'user2@email.com',
    password: '123Ab*',
    hash: { iv: '', encryptedData: '' },
  },
  {
    name: 'User 3',
    email: 'user3@email.com',
    password: 'xyz98#',
    hash: { iv: '', encryptedData: '' },
  },
];

export function testValidateUser(user, expectedData) {
  expect(user).toBeDefined();
  expect(user).toBeInstanceOf(UserEntity);
  expect(user.id).toEqual(expectedData.id);
  expect(user.name).toEqual(expectedData.name);
  expect(user.email).toEqual(expectedData.email);
  expect(user.password).toBeUndefined();
  expect(user.hash).toBeUndefined();
  expect(user.created).toBeDefined();
  expect(user.updated).toBeDefined();
  expect(user.deletedAt).toBeNull();
  expect(Object.keys(user)).toEqual([
    'id',
    'name',
    'email',
    'created',
    'updated',
    'deletedAt',
  ]);
}

export async function testCreateUser(
  userRepo: Repository<UserEntity>,
  createCallback: (userDada: any) => Promise<UserEntity>,
) {
  const createdUsersData = [
    await createCallback({
      name: usersData[0].name,
      email: usersData[0].email,
      password: usersData[0].password,
    }),
    await createCallback({
      name: usersData[1].name,
      email: usersData[1].email,
      password: usersData[1].password,
    }),
    await createCallback({
      name: usersData[2].name,
      email: usersData[2].email,
      password: usersData[2].password,
    }),
  ];

  const expectedData = [
    { id: 1, name: usersData[0].name, email: usersData[0].email },
    { id: 2, name: usersData[1].name, email: usersData[1].email },
    { id: 3, name: usersData[2].name, email: usersData[2].email },
  ];
  const users = await userRepo.find();

  expect(users).toHaveLength(3);

  testValidateUser(createdUsersData[0], expectedData[0]);
  testValidateUser(createdUsersData[1], expectedData[1]);
  testValidateUser(createdUsersData[2], expectedData[2]);

  testValidateUser(users[0], expectedData[0]);
  testValidateUser(users[1], expectedData[1]);
  testValidateUser(users[2], expectedData[2]);
}

export async function testUpdateUser(
  userRepo: Repository<UserEntity>,
  updateCallback: (userId: number, userDada: any) => Promise<UserEntity>,
) {
  let newName = 'New Name';
  let newEmail = 'newname@email.com';
  let updateData = { name: newName, email: newEmail };
  let expectedUpdateData = [
    {
      id: 1,
      name: usersData[0].name,
      email: usersData[0].email,
    },
    {
      id: 2,
      name: newName,
      email: newEmail,
    },
    {
      id: 3,
      name: usersData[2].name,
      email: usersData[2].email,
    },
  ];

  const createdUsers = [
    userRepo.create(usersData[0]),
    userRepo.create(usersData[1]),
    userRepo.create(usersData[2]),
  ];

  await userRepo.insert(createdUsers[0]);
  await userRepo.insert(createdUsers[1]);
  await userRepo.insert(createdUsers[2]);

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
  const createdUSers = [
    userRepo.create(usersData[0]),
    userRepo.create(usersData[1]),
    userRepo.create(usersData[2]),
  ];
  await userRepo.save(createdUSers[0]);
  await userRepo.save(createdUSers[1]);
  await userRepo.save(createdUSers[2]);
  const users = await findCallback();
  expect(Array.isArray(users)).toBe(true);
  expect(users).toHaveLength(3);
  const expectedData = [
    { id: 1, name: usersData[0].name, email: usersData[0].email },
    { id: 2, name: usersData[1].name, email: usersData[1].email },
    { id: 3, name: usersData[2].name, email: usersData[2].email },
  ];

  testValidateUser(users[0], expectedData[0]);
  testValidateUser(users[1], expectedData[1]);
  testValidateUser(users[2], expectedData[2]);
}

export async function testFindUserForId(
  userRepo: Repository<UserEntity>,
  findForIdCallback: (userId: number) => Promise<UserEntity>,
) {
  const createdUsers = [
    userRepo.create(usersData[0]),
    userRepo.create(usersData[1]),
    userRepo.create(usersData[2]),
  ];
  await userRepo.save(createdUsers[0]);
  await userRepo.save(createdUsers[1]);
  await userRepo.save(createdUsers[2]);
  const expectedData = {
    id: 2,
    name: usersData[1].name,
    email: usersData[1].email,
  };
  const foundUser = await findForIdCallback(2);

  testValidateUser(foundUser, expectedData);
}
