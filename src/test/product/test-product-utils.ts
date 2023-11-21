import { Repository } from 'typeorm';
import { Product } from '../../modules/stock/product/models/product/product.entity';

function getProductExpectedFields(
  brand: boolean,
  category: boolean,
  images: boolean,
) {
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
  if (images) fields.push('images');
  if (brand) fields.push('brand');
  if (category) fields.push('category');

  return fields.sort();
}

type ExpectedProductData = {
  id?: string;
  code: string;
  name: string;
  model: string;
  price: number;
  quantityInStock: number;
  active: boolean;
  brandId: string;
  categoryId: string;
  deleted?: boolean;
  brand?: {
    id: string;
    name: string;
    active: boolean;
  };
  category?: {
    id: string;
    name: string;
    active: boolean;
  };
  images?: {
    id: string;
    name?: string;
    description?: string;
    image: string;
    thumbnail?: string;
    active: boolean;
    main: boolean;
    productId: string;
    deleted?: boolean;
  }[];
};

export function testValidateProduct(
  product: Product,
  expectedProductData: ExpectedProductData,
) {
  expect(product).toBeDefined();
  if (expectedProductData.id) {
    expect(product.id).toEqual(expectedProductData.id);
  } else {
    expect(product.id).toBeDefined();
  }
  expect(product.code).toEqual(expectedProductData.code);
  expect(product.name).toEqual(expectedProductData.name);
  expect(product.model).toEqual(expectedProductData.model);
  expect(product.price).toEqual(expectedProductData.price);
  expect(product.active).toEqual(expectedProductData.active);
  expect(product.created).toBeDefined();
  expect(product.updated).toBeDefined();
  if (expectedProductData.deleted) {
    expect(product.deletedAt).toBeDefined();
  } else {
    expect(product.deletedAt).toBeNull();
  }
  expect(product.brandId).toEqual(expectedProductData.brandId);
  expect(product.categoryId).toEqual(expectedProductData.categoryId);

  const expectedFields = getProductExpectedFields(
    !!expectedProductData.brand,
    !!expectedProductData.category,
    !!expectedProductData.images,
  );
  expect(Object.keys(product).sort()).toEqual(expectedFields);

  if (expectedProductData.brand) {
    expect(Object.keys(product).sort()).toEqual(expectedFields);
    expect(product.brand).toBeDefined();
    expect(product.brand.id).toEqual(expectedProductData.brand.id);
    expect(product.brand.name).toEqual(expectedProductData.brand.name);
    expect(product.brand.active).toEqual(expectedProductData.brand.active);
  }

  if (expectedProductData.category) {
    expect(Object.keys(product).sort()).toEqual(expectedFields);
    expect(product.category).toBeDefined();
    expect(product.category.id).toEqual(expectedProductData.category.id);
    expect(product.category.name).toEqual(expectedProductData.category.name);
    expect(product.category.active).toEqual(
      expectedProductData.category.active,
    );
  }

  if (expectedProductData.images) {
    const images = product.images;
    const expectedImagesData = expectedProductData.images;
    expect(images).toBeDefined();
    expect(images).toHaveLength(expectedImagesData.length);
    const nonRepeatedIds = [...new Set(images.map((i) => i.id))];
    expect(nonRepeatedIds).toHaveLength(images.length);
    for (let i = 0; i < images.length; i++) {
      expect(images[i]).toBeDefined();
      expect(images[i].id).toEqual(expectedImagesData[i].id);
      expect(images[i].name).toEqual(expectedImagesData[i].name);
      expect(images[i].description).toEqual(expectedImagesData[i].description);
      expect(images[i].active).toEqual(expectedImagesData[i].active);
      expect(images[i].productId).toEqual(expectedImagesData[i].productId);
      expect(images[i].productId).toEqual(product.id);
      expect(images[i].created).toBeDefined();
      expect(images[i].updated).toBeDefined();
      if (expectedImagesData[i].deleted) {
        expect(images[i].deletedAt).toBeDefined();
      } else {
        expect(images[i].deletedAt).toBeNull();
      }
      expect(Object.keys(images[i]).sort()).toEqual(
        [
          'id',
          'name',
          'description',
          'image',
          'thumbnail',
          'active',
          'main',
          'created',
          'updated',
          'deletedAt',
          'productId',
        ].sort(),
      );
    }
  }
}

export function testValidateProducts(
  products: Product[],
  expectedProductsData: ExpectedProductData[],
) {
  expect(expectedProductsData).toBeDefined();
  const nonRepeatedIds = [...new Set(products.map((i) => i.id))];
  expect(nonRepeatedIds).toHaveLength(products.length);
  expect(products).toHaveLength(expectedProductsData.length);
  for (let i = 0; i < products.length; i++) {
    testValidateProduct(products[i], expectedProductsData[i]);
  }
}

export type TestProductInsertParams = {
  code: string;
  name: string;
  model: string;
  price: number;
  quantityInStock?: number;
  active?: boolean;
  brandId?: string;
  categoryId?: string;
  deletedAt?: Date;
};

export async function testInsertProducts(
  productRepo: Repository<Product>,
  products: TestProductInsertParams[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const product of products) {
    const ret = await productRepo
      .createQueryBuilder()
      .insert()
      .into(Product)
      .values(product)
      .execute();
    ids.push(ret.identifiers[0].id);
  }
  return ids;
}
