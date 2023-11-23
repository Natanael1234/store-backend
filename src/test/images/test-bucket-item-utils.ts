import { BucketItem } from '../../__mocks__/minio';

type ExpectedImageItemParams = {
  size: number;
  path: string;
};

export function testValidateBucketItem(
  expectedData: ExpectedImageItemParams,
  bucketItem: BucketItem,
) {
  expect(bucketItem).toBeDefined();
  expect(bucketItem.name).toEqual(expectedData.path);
  expect(bucketItem.lastModified).toBeDefined();
  expect(bucketItem.etag).toBeDefined();
  expect(bucketItem.size).toEqual(expectedData.size);
}

export function testValidateBuckedItems(
  expectedData: ExpectedImageItemParams[],
  bucketItems: BucketItem[],
) {
  expect(bucketItems).toBeDefined();
  expect(bucketItems).toHaveLength(expectedData.length);
  for (let i = 0; i < bucketItems.length; i++) {
    const expectedItem = expectedData[i];
    const bucketItem = bucketItems[i];
    testValidateBucketItem(expectedItem, bucketItem);
  }
}
