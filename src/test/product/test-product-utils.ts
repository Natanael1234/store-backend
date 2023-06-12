import { ProductEntity } from '../../modules/stock/models/product/product.entity';

function getExpectedFields(brand: boolean, category: boolean) {
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
    'categoryId',
  ];
  if (brand) fields.push('brand');
  if (category) fields.push('category');

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
  expect(product.categoryId).toEqual(expectedData.categoryId);

  const expectedFields = getExpectedFields(
    !!expectedData.brand,
    !!expectedData.category,
  );
  expect(Object.keys(product).sort()).toEqual(expectedFields);

  if (expectedData.brand) {
    expect(Object.keys(product).sort()).toEqual(expectedFields);
    expect(product.brand).toBeDefined();
    expect(product.brand.id).toEqual(expectedData.brand.id);
    expect(product.brand.name).toEqual(expectedData.brand.name);
    expect(product.brand.active).toEqual(expectedData.brand.active);
  }

  if (expectedData.category) {
    expect(Object.keys(product).sort()).toEqual(expectedFields);
    expect(product.category).toBeDefined();
    expect(product.category.id).toEqual(expectedData.category.id);
    expect(product.category.name).toEqual(expectedData.category.name);
    expect(product.category.active).toEqual(expectedData.category.active);
    expect(product.category.parentId).toEqual(expectedData.category.parentId);
  }
}

export function testValidateProductArray(
  products: ProductEntity[],
  expectedData: any[],
) {
  expect(products).toHaveLength(expectedData.length);
  for (let i = 0; i < products.length; i++) {
    testValidateProduct(products[i], expectedData[i]);
  }
}
