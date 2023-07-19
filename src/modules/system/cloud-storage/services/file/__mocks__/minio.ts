import { NotImplementedException } from '@nestjs/common';

import { ClientOptions, UploadedObjectInfo } from 'minio';
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

export class Client {
  static readonly calls: TestMethodCall[] = [];
  static readonly _buckets: { [key: string]: BucketItem[] } = {};
  static readonly _buffers: { objectName: string; buffer: Buffer }[] = [];
  static readonly _bucketPolices: { [bucketName: string]: string } = {};
  constructor(public readonly options: ClientOptions) {}

  static reset() {
    // clean buckets
    for (const bucketName of Object.keys(Client._buckets)) {
      delete this._buckets[bucketName];
    }

    // clean buffers
    this._buffers.splice(0, this._buffers.length);

    // clean policies
    for (const policeBucketName of Object.keys(Client._bucketPolices)) {
      delete this._bucketPolices[policeBucketName];
    }
  }

  async bucketExists(bucketName: string): Promise<boolean> {
    return !!Client._buckets[bucketName];
  }

  async makeBucket(bucketName: string): Promise<void> {
    if (!Client._buckets[bucketName]) {
      Client._buckets[bucketName] = [];
    }
  }

  async putObject(
    bucketName: string,
    objectName: string,
    stream: ReadableStream | Buffer | string,
  ): Promise<UploadedObjectInfo> {
    this.checkBucket(bucketName);

    const etag = Date.now() + '-' + Math.round(Math.random() * 1e9); // not the real way it's generated

    const buffer = await this.convertToBuffer(stream);
    const size = buffer.byteLength;
    const bucketItem: BucketItem = {
      name: objectName,
      lastModified: new Date(),
      etag,
      size,
    };
    Client._buckets[bucketName].push(bucketItem);
    const ret = { etag, versionId: null };

    Client._buffers.push({
      objectName,
      buffer,
    });
    Client.calls.push({
      method: 'putObject',
      parameters: { bucketName, objectName },
      return: ret,
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

    Client.calls.push({
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
    const bucket = Client._buckets[bucketName];
    const obj = bucket.find((object) => object.name == objectName);
    const bufferData = Client._buffers.find((i) => i.objectName == objectName);
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
    return stream;
  }

  async removeObjects(
    bucketName: string,
    objectsList: string[],
  ): Promise<void> {
    const bucket = Client._buckets[bucketName];
    if (bucket) {
      return;
    }
    for (const objectItem of objectsList) {
      const idx = bucket.findIndex(
        (bucketItem) => bucketItem.name == objectItem,
      );
      if (idx >= 0) {
        bucket.splice(idx, 1);
      }
    }
    Client.calls.push({
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
    prefix = prefix.replace(/\//g, '\\');
    this.checkBucket(bucketName);

    let bucket: BucketItem[] = Client._buckets[bucketName];
    if (!bucket) {
      throw new BucketDoesNotExistsError(bucketName); // TODO: use the same minio error
    }
    // filter items whose names starts with the prefix. The prefix is equivalent to the starth of the path to the file
    let items: BucketItem[] = bucket.filter((item) => {
      return item.name?.startsWith(prefix);
    });
    // if should return subdirectories contents
    if (recursive) {
      this.sortItems(items);
      return items;
    }

    const listedDirectories: object = {};

    // map subdirectorry itens to subdirectories in the same level
    items = items.map((item) => {
      // map inner files to directory
      const tail = item.name.slice(prefix.length).replace(/^\\/g, '');

      const tokens = tail.split('\\');
      const isDirectory = tokens.length >= 2;
      if (isDirectory) {
        const item: BucketItem = {
          prefix: prefix + '\\' + tokens[0] + '\\',
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

    this.sortItems(items);
    Client.calls.push({
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
    let bucket: BucketItem[] = Client._buckets[bucketName];
    if (!bucket) {
      throw new BucketDoesNotExistsError(bucketName); // TODO: use the same minio error
    }
  }

  private sortItems(bucketItems: BucketItem[]): BucketItem[] {
    return bucketItems.sort((a: BucketItem, b: BucketItem) => {
      // sort
      const nameA = a.name || a.prefix;
      const nameB = b.name || b.prefix;
      const timeA = a.lastModified?.getTime();
      const timeB = b.lastModified?.getTime();
      if (nameA < nameB) {
        return -1;
      } else if (nameA > nameB) {
        return 1;
      } else if (timeA < timeB) {
        return -1;
      } else {
        return 1;
      }
    });
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
