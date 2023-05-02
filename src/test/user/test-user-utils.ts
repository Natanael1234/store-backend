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
