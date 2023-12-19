import { Repository } from 'typeorm';
import { ProductImage } from '../../modules/stock/product-image/models/product-image/product-image.entity';

type ExpectedProductImageData = {
  id?: string;
  name?: string;
  description?: string;
  image: string;
  thumbnail?: string;
  active: boolean;
  main: boolean;
  productId: string;
  deleted?: boolean;
};

export function testValidateProductImage(
  image: ProductImage,
  expectedImageData: ExpectedProductImageData,
) {
  expect(image).toBeDefined();
  expect(image.name).toEqual(expectedImageData.name);
  if (expectedImageData.id) {
    expect(image.id).toEqual(expectedImageData.id);
  } else {
    expect(image.id).toBeDefined();
  }
  expect(image.description).toEqual(expectedImageData.description);
  expect(image.active).toEqual(expectedImageData.active);
  expect(image.productId).toEqual(expectedImageData.productId);
  expect(image.created).toBeDefined();
  expect(image.updated).toBeDefined();
  if (expectedImageData.deleted) {
    expect(image.deletedAt).toBeDefined();
  } else {
    expect(image.deletedAt).toBeNull();
  }
  expect(Object.keys(image).sort()).toEqual(
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

export function testValidateProductImages(
  images: ProductImage[],
  expectedData: ExpectedProductImageData[],
) {
  expect(images).toBeDefined();
  expect(images).toHaveLength(expectedData.length);
  const nonRepeatedIds = [...new Set(images.map((i) => i.id))];
  expect(nonRepeatedIds).toHaveLength(images.length);
  for (let i = 0; i < images.length; i++) {
    testValidateProductImage(images[i], expectedData[i]);
  }
}

export type TestProductImageInsertParams = {
  image: string;
  thumbnail?: string;
  active?: boolean;
  name?: string;
  description?: string;
  main?: boolean;
  productId: string;
};

export async function testInsertProductImages(
  productImageRepo: Repository<ProductImage>,
  images: TestProductImageInsertParams[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const image of images) {
    const ret = await productImageRepo
      .createQueryBuilder()
      .insert()
      .into(ProductImage)
      .values(image)
      .execute();
    ids.push(ret.identifiers[0].id);
  }
  return ids;
}
