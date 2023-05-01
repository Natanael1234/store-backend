import { testValidateBrand } from './test-brand-utils';

function getExpectedFields(brands: boolean) {
  const fields = [
    'id',
    'code',
    'name',
    'model',
    'price',
    'quantityInStock',
    'active',
    'created',
    'updated',
    'deletedAt',
    'brandId',
  ];
  if (brands) fields.push('brand');

  return fields.sort();
}

export function testValidateProduct(product, expectedData) {
  expect(product).toBeDefined();
  expect(product.id).toEqual(expectedData.id);

  expect(product.code).toEqual(expectedData.code);
  expect(product.name).toEqual(expectedData.name);
  expect(product.model).toEqual(expectedData.model);
  expect(product.price).toEqual(expectedData.price);
  expect(product.active).toEqual(expectedData.active);
  expect(product.created).toBeDefined();
  expect(product.updated).toBeDefined();
  expect(product.deletedAt).toBeNull();
  expect(product.brandId).toEqual(expectedData.brandId);

  const expectedFields = getExpectedFields(!!expectedData.brand);
  expect(Object.keys(product).sort()).toEqual(expectedFields);

  if (expectedData.brand) {
    testValidateBrand(product.brand, expectedData.brand);
    expect(Object.keys(product).sort()).toEqual(expectedFields);
  }
}
