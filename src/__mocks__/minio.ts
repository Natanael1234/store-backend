import { NotImplementedException } from '@nestjs/common';

import * as _ from 'lodash';
import { BucketItemCopy, ClientOptions, UploadedObjectInfo } from 'minio';
import internal, { Readable } from 'stream';
class BucketStream<T> {
  onData: (item: T) => void;
  onError: (err: Error) => void;
  onEnd: () => void;

  on(
    event: 'data' | 'end' | 'error',
    listener: (val?: T | Error) => void | this,
  ) {
    if (event == 'data') {
      this.onData = listener;
    } else if (event == 'error') {
      this.onError = listener;
    } else if (event == 'end') {
      this.onEnd = listener;
    } else {
      throw new NotImplementedException('Event not implemented');
    }
  }
}

export interface BucketItem {
  name?: string;
  prefix?: string;
  size: number;
  etag?: string;
  lastModified?: Date;
}

export type TestMethodCall = {
  method: string;
  parameters: any;
  return: any;
};

class BucketDoesNotExistsError extends Error {
  resource: string;
  code: string;
  constructor(bucketname: string) {
    super('The specified bucket does not exist');
    this.name = 'S3Error';
    this.resource = '/' + bucketname;
    this.code = 'NoSuchBucket';
  }
}
/**
 * Mocks data storage for tests.
 * Presumes versioning deisabled.
 */
export class Client {
  /** Calls to storage functions are stored here for testing purposes. */
  static readonly calls: TestMethodCall[] = [];

  /* Bucket itens are stored here. */
  static readonly _buckets: { [bucketKey: string]: BucketItem[] } = {};

  /* Data buffers of bucket itens are stoted here. */
  static readonly _bucketBuffers: {
    [bucketKey: string]: { objectName: string; buffer: Buffer }[];
  } = {};

  /** Bucket policies are stored here. */
  static readonly _bucketPolices: { [bucketName: string]: string } = {};

  constructor(public readonly options: ClientOptions) {}

  static _getBucketsSnapshot() {
    const buckets = Client._buckets;
    const snapshot = _.cloneDeep(buckets);
    return snapshot;
  }

  static _getBucketSnapshot(bucketName: string) {
    const bucket = Client._buckets[bucketName];
    const snapshot = _.cloneDeep(bucket);
    return snapshot;
  }

  static reset() {
    // clean buckets
    for (const bucketName of Object.keys(Client._buckets)) {
      delete this._buckets[bucketName];
    }

    // clean buffers
    for (const key of Object.keys(this._bucketBuffers)) {
      delete this._bucketBuffers[key];
    }

    // clean policies
    for (const policeBucketName of Object.keys(Client._bucketPolices)) {
      delete this._bucketPolices[policeBucketName];
    }
  }

  public static _getBuckets() {
    return Client._buckets;
  }

  public static _getBucket(bucketName: string): BucketItem[] {
    return Client._buckets[bucketName];
  }

  public static _getBucketBuffers(bucketName: string) {
    return Client._bucketBuffers[bucketName];
  }

  public static _deleteBucketItem(bucketName: string, objectName: string) {
    const buffers = Client._getBucket(bucketName);
    const idx = buffers.findIndex((b) => b.name == objectName);
    if (idx != -1) {
      buffers.splice(idx, 1);
      return true;
    }
    return false;
  }

  public static _deleteBucketBufferItem(
    bucketName: string,
    objectName: string,
  ) {
    const buffers = Client._getBucketBuffers(bucketName);
    const idx = buffers.findIndex((b) => b.objectName == objectName);
    if (idx != -1) {
      buffers.splice(idx, 1);
      return true;
    }
    return false;
  }

  private static registerCall(call: {
    method: string;
    parameters: any;
    return: any;
  }) {
    Client.calls.push(call);
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    return !!Client._getBucket(bucketName);
  }

  async makeBucket(bucketName: string): Promise<void> {
    if (!Client._buckets[bucketName]) {
      Client._buckets[bucketName] = [];
      Client._bucketBuffers[bucketName] = [];
    }
  }

  /* not the real way it's generated.*/
  private mockEtag() {
    return Date.now() + '-' + Math.round(Math.random() * 1e9);
  }

  async putObject(
    bucketName: string,
    objectName: string,
    stream: ReadableStream | Buffer | string,
  ): Promise<UploadedObjectInfo> {
    this.checkBucket(bucketName);
    const bucket = Client._getBucket(bucketName);
    const bucketBuffers = Client._getBucketBuffers(bucketName);

    const destIdx = bucket.findIndex((object) => object.name == objectName);
    const bufferIdx = bucketBuffers.findIndex(
      (o) => o.objectName == objectName,
    );
    const name = objectName;
    const etag = this.mockEtag();
    const buffer = await this.convertToBuffer(stream);
    const size = buffer.byteLength;
    const lastModified = new Date();
    const bucketItem: BucketItem = { name, lastModified, etag, size };

    if (destIdx == -1) {
      bucket.push(bucketItem);
    } else {
      bucket[destIdx] = bucketItem;
    }

    const bucketBuffer = { objectName, buffer };
    if (bufferIdx == -1) {
      bucketBuffers.push(bucketBuffer);
    } else {
      bucketBuffers[bufferIdx] = bucketBuffer;
    }

    const ret = { etag, versionId: null };
    Client.registerCall({
      method: 'putObject',
      parameters: { bucketName, objectName },
      return: ret,
    });
    return ret;
  }

  async copyObject(
    bucketName: string,
    objectName: string,
    sourceObject: string,
  ): Promise<BucketItemCopy> {
    this.checkBucket(bucketName);
    const bucket = Client._getBucket(bucketName);
    const bucketBuffers = Client._getBucketBuffers(bucketName);

    const destIdx = bucket.findIndex((object) => object.name == objectName);
    const bufferIdx = bucketBuffers.findIndex(
      (o) => o.objectName == objectName,
    );
    const sourceObj = bucket.find((object) => object.name == sourceObject);
    const sourceBufferData = bucketBuffers.find(
      (i) => i.objectName == sourceObject,
    );
    if (!sourceObj || !sourceBufferData?.buffer) {
      // TODO: presuming error message. Chefk the real error message.
      const error: any = new Error(
        'S3Error: The specified key does not exist.',
      );
      error.key = objectName;
      error.message = 'The specified key does not exist.';
      error.name = 'S3Error';
      error.resource = bucketName + '/' + objectName;
      error.code = 'NoSuchKey';
      throw error as Error;
    }
    // creates copy of source object
    const name = objectName;
    const etag = this.mockEtag();
    const buffer = sourceBufferData.buffer;
    const size = sourceBufferData.buffer.byteLength;
    const lastModified = new Date();
    const bucketItem: BucketItem = { name, lastModified, etag, size };

    if (destIdx == -1) {
      bucket.push(bucketItem);
    } else {
      bucket[destIdx] = bucketItem;
    }

    const bucketBuffer = { objectName, buffer };
    if (bufferIdx == -1) {
      bucketBuffers.push(bucketBuffer);
    } else {
      bucketBuffers[bufferIdx] = bucketBuffer;
    }

    const ret = { etag, lastModified: null };
    Client.registerCall({
      method: 'copyObject',
      parameters: { bucketName, objectName },
      return: ret, // TODO: verificar se é isso que o copy retorna
    });
    return ret;
  }

  listObjectsV2(
    bucketName: string,
    prefix?: string,
    recursive?: boolean,
    // startAfter?: string,
  ): BucketStream<BucketItem> {
    this.checkBucket(bucketName);

    const bucketItems: BucketItem[] = this.getBucketItems(
      bucketName,
      prefix,
      recursive,
    );
    const stream = new BucketStream<BucketItem>();
    setTimeout(() => {
      for (const bucketItem of bucketItems) {
        stream.onData(bucketItem);
      }
      stream.onEnd();
    }, 20);

    Client.registerCall({
      method: 'listObjectsV2',
      parameters: { bucketName, prefix, recursive },
      return: stream,
    });
    return stream;
  }

  async getObject(
    bucketName: string,
    objectName: string,
  ): Promise<internal.Readable> {
    this.checkBucket(bucketName);
    const bucket = Client._getBucket(bucketName);
    const bucketBuffers = Client._getBucketBuffers(bucketName);

    const obj = bucket.find((object) => object.name == objectName);
    const bufferData = bucketBuffers.find((i) => i.objectName == objectName);
    if (!obj || !bufferData?.buffer) {
      const error: any = new Error(
        'S3Error: The specified key does not exist.',
      );
      error.key = objectName;
      error.message = 'The specified key does not exist.';
      error.name = 'S3Error';
      error.resource = bucketName + '/' + objectName;
      error.code = 'NoSuchKey';
      throw error as Error;
    }
    const buffer = bufferData.buffer;
    const stream = Readable.from(buffer);
    Client.registerCall({
      method: 'getObject',
      parameters: { bucketName, objectName },
      return: 'stream',
    });
    return stream;
  }

  async removeObjects(
    bucketName: string,
    objectsList: string[],
  ): Promise<void> {
    this.checkBucket(bucketName);
    const bucket = Client._getBucket(bucketName);
    const buffers = Client._getBucketBuffers(bucketName);
    for (const objectItem of objectsList) {
      const itemIdx = bucket.findIndex((bucketItem) => {
        return bucketItem.name == objectItem;
      });
      if (itemIdx >= 0) {
        Client._deleteBucketItem(bucketName, objectItem);
      }
      const bufferIdx = buffers.findIndex((bucketItem) => {
        return bucketItem.objectName == objectItem;
      });
      if (bufferIdx >= 0) {
        Client._deleteBucketBufferItem(bucketName, objectItem);
      }
    }
    Client.registerCall({
      method: 'removeObjects',
      parameters: { bucketName, objectsList },
      return: null,
    });
  }

  private getBucketItems(
    bucketName: string,
    prefix: string,
    recursive: boolean,
  ): BucketItem[] {
    this.checkBucket(bucketName);
    const bucket = Client._getBucket(bucketName);

    if (!bucket) {
      throw new BucketDoesNotExistsError(bucketName); // TODO: use the same minio error
    }
    // filter items whose names starts with the prefix. The prefix is equivalent to the start of the path to the file.
    let items: BucketItem[] = bucket.filter((item) => {
      return item.name?.startsWith(prefix);
    });
    // if should return subdirectories contents
    if (recursive) {
      return items;
    }

    const listedDirectories: object = {};

    // map subdirectory items to subdirectories in the same level
    items = items.map((item) => {
      // map inner files to directory
      const tailTokens = item.name
        .replace(/^\//g, '')
        .substring(prefix.length)
        .split('/');
      const isDirectory = tailTokens.length >= 2;
      if (isDirectory) {
        if (prefix && !prefix.endsWith('/')) {
          prefix += '/';
        }
        const item: BucketItem = {
          prefix: prefix + tailTokens[0] + '/',
          size: 0,
        };
        return item;
      } else {
        return item;
      }
    });

    // remove duplicated directories
    items = items.filter((item) => {
      const isFile = !!item.name;
      // if is file don't exclude
      if (isFile) {
        return true;
      }
      // if is directory exclude duplicated directories
      else {
        const listedDirectory = item.prefix && !listedDirectories[item.prefix];
        if (listedDirectory) {
          listedDirectories[item.prefix] = true;
          return true;
        } else {
          return false;
        }
      }
    });

    Client.registerCall({
      method: 'getBucketItems',
      parameters: { bucketName, prefix, recursive },
      return: items,
    });

    return items;
  }

  public async setBucketPolicy(
    bucketName: string,
    bucketPolicy: string,
  ): Promise<void> {
    await this.checkBucket(bucketName);
    Client._bucketPolices[bucketName] = bucketPolicy;
  }

  private checkBucket(bucketName: string) {
    let bucket = Client._getBucket(bucketName);
    if (!bucket) {
      throw new BucketDoesNotExistsError(bucketName); // TODO: use the same minio error
    }
  }

  private async convertToBuffer(
    stream: ReadableStream | Buffer | string,
  ): Promise<Buffer> {
    if (stream instanceof Buffer) {
      return stream; // If already a buffer, return as is
    }

    if (typeof stream === 'string') {
      return Buffer.from(stream); // Convert string to buffer
    }

    // If it's a ReadableStream, read it and convert to buffer
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
    }

    const concatenated =
      chunks.length === 1 ? chunks[0] : Buffer.concat(chunks);
    return Buffer.from(concatenated);
  }
}
