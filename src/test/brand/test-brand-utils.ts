const expectedFields = [
  'id',
  'name',
  'active',
  'created',
  'updated',
  'deletedAt',
].sort();

export function testValidateBrand(brand, expectedData) {
  expect(brand).toBeDefined();
  expect(brand.id).toEqual(expectedData.id);
  expect(brand.name).toEqual(expectedData.name);
  expect(brand.active).toEqual(expectedData.active);
  expect(brand.created).toBeDefined();
  expect(brand.updated).toBeDefined();
  expect(brand.deletedAt).toBeNull();
  expect(Object.keys(brand).sort()).toEqual(expectedFields);
}
