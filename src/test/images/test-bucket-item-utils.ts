import { BucketItem } from '../../__mocks__/minio';

export function testValidateBucketItem(
  expectedData: {
    productId: string;
    isThumbnail: boolean;
    extension: string;
    size: number;
  },
  bucketItem: BucketItem,
) {
  const { productId, isThumbnail, extension: expectedExtension } = expectedData;
  expect(bucketItem).toBeDefined();

  const thumbnailsStr = isThumbnail ? 'thumbnails/' : '';
  const regexpStr = `^images/products/${productId}/${thumbnailsStr}[\\d]+\\-[\\d]+\\.${expectedExtension}`;
  try {
    expect(bucketItem.name).toMatch(new RegExp(regexpStr));
  } catch (error) {
    throw error;
  }
  expect(bucketItem.lastModified).toBeDefined();
  expect(bucketItem.etag).toBeDefined();
  expect(bucketItem.size).toEqual(expectedData.size);
}

export function testValidateBuckedItems(
  expectedData: {
    productId: string;
    isThumbnail: boolean;
    extension: string;
    size: number;
  }[],
  bucketItems: BucketItem[],
) {
  expect(bucketItems).toBeDefined();
  expect(bucketItems).toHaveLength(expectedData.length);
  for (let i = 0; i < bucketItems.length; i++) {
    testValidateBucketItem(expectedData[i], bucketItems[i]);
  }
}
