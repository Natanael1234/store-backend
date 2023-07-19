import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getTestingModule } from '../../../../../.jest/test-config.module';
import { MinioCongifs } from '../../configs/minio/minio.configs';
import { BucketItem, Client } from './__mocks__/minio';
import { CloudStorageService } from './cloud-storage.service';
import { FileMessage } from './file-messages/file-messages.enum';

jest.mock('minio');

const filePaths = [
  path.join(__dirname, 'test', 'caramelo.jpg'),
  path.join(__dirname, 'test', 'cartoon-dog.png'),
  path.join(__dirname, 'test', 'caramelo-2.jpg'),
  path.join(__dirname, 'test', 'cartoon-dog-2.png'),
  path.join(__dirname, 'test', 'cartoon-dog-3.png'),
];

async function createMockFile(filepath: string): Promise<Express.Multer.File> {
  const fieldname = 'myField';
  const originalname = 'example.jpg';
  const encoding = '7bit';
  const mimetype = 'image/jpeg';
  const size = 1024; // file size in bytes
  // const buffer = Buffer.from('file content'); // replace 'file content' with the actual file content
  const buffer = Buffer.from(await fs.readFile(filepath));
  const filename = 'some-filename.jpg';
  const stream = null;
  const destination = '';
  const path = '';

  const mockFile: Express.Multer.File = {
    fieldname,
    originalname,
    encoding,
    mimetype,
    size,
    buffer,
    stream,
    destination,
    filename,
    path,
  };

  return mockFile;
}

function validateBuckets(bucketsOptions: { name: string; numFiles: number }[]) {
  const buckets = Client._buckets;
  expect(buckets).toBeDefined();
  expect(Object.keys(buckets)).toHaveLength(bucketsOptions.length);
  for (const bucketsOption of bucketsOptions) {
    const bucket = buckets[bucketsOption.name];
    expect(bucket).toBeDefined();
    expect(bucket).toHaveLength(bucketsOption.numFiles);
  }
}

async function buildFiles(quantity: number): Promise<Express.Multer.File[]> {
  if (!quantity || quantity < 0 || quantity > filePaths.length) {
    throw new Error('Invalid file quantity');
  }
  const files: Express.Multer.File[] = [];
  for (let i = 0; i < quantity; i++) {
    const path = filePaths[i];
    const file = await createMockFile(path);
    files.push(file);
  }
  return files;
}

function validateBucketFile(
  file: Express.Multer.File,
  bucketItem: BucketItem,
  regexp: RegExp,
) {
  expect(typeof bucketItem.name).toEqual('string');
  expect(bucketItem.name).toMatch(regexp);
  expect(typeof bucketItem.etag).toEqual('string');
  expect(bucketItem.lastModified).toBeInstanceOf(Date);
  expect(bucketItem.size).toEqual(Buffer.byteLength(file.buffer));
  expect(bucketItem.prefix).toBeUndefined();
}

describe('CloudStorageService', () => {
  let module: TestingModule;
  let fileService: CloudStorageService;

  beforeEach(async () => {
    module = await getTestingModule({});

    fileService = module.get<CloudStorageService>(CloudStorageService);

    Client.reset();
  });

  it('should be defined', () => {
    expect(fileService).toBeDefined();
  });

  describe('save', () => {
    it('should save files', async () => {
      const files = await buildFiles(2);
      const ret = await fileService.save(files, 'test/images');

      expect(ret).toEqual(true);
      validateBuckets([{ name: 'test-store-bucket', numFiles: 2 }]);
      const buckets = Client._buckets;
      const bucket = buckets['test-store-bucket'];
      expect(bucket[0]).toBeDefined();
      expect(bucket[1]).toBeDefined();
      validateBucketFile(
        files[0],
        bucket[0],
        /test\\images\\[\d]+\-[\d]+\.jpg/g,
      );
      validateBucketFile(
        files[1],
        bucket[1],
        /test\\images\\[\d]+\-[\d]+\.jpg/g,
      );
      expect(bucket[0].name).not.toEqual(bucket[1].name);
      expect(Object.keys(Client._bucketPolices)).toEqual(['test-store-bucket']);
      expect(Client._bucketPolices).toEqual({
        'test-store-bucket': MinioCongifs.getPublicReadPolicy(
          'test-store-bucket',
          ['images/products', 'images/products/*'],
        ),
      });
    });

    it('should fail when files is null', async () => {
      const fn = () => fileService.save(null, 'test/images');
      await expect(fn()).rejects.toThrow(FileMessage.FILES_NOT_DEFINED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    });

    it('should fail when one file is not defined', async () => {
      const fn = () => fileService.save([null], 'test/images');
      await expect(fn()).rejects.toThrow(FileMessage.FILE_NOT_DEFINED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(Object.values(Client._buckets)).toHaveLength(0);
    });

    it('should fail when directory is not defined', async () => {
      const files = await buildFiles(1);
      const fn = () => fileService.save(files, null);
      await expect(fn()).rejects.toThrow(FileMessage.DIRECTORY_NOT_DEFINED);
      await expect(fn()).rejects.toThrow(BadRequestException);
      expect(Object.values(Client._buckets)).toHaveLength(0);
    });

    it('should fail when file buffer has wrong type', async () => {
      const files = await buildFiles(1);
      files[0].buffer = true as unknown as Buffer;
      const fn = () => fileService.save(files, 'test/images');
      await expect(fn()).rejects.toThrow(FileMessage.INVALID_FILE);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(Object.values(Client._buckets)).toHaveLength(0);
    });

    it('should fail when file originalname is not defined', async () => {
      const files = await buildFiles(1);
      files[0].originalname = null;
      const fn = () => fileService.save(files, 'test/images');
      await expect(fn()).rejects.toThrow(FileMessage.NAME_NOT_DEFINED);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(Object.values(Client._buckets)).toHaveLength(0);
    });

    it('should fail when file originalname has wrong type', async () => {
      const files = await buildFiles(1);
      files[0].originalname = true as unknown as string;
      const fn = () => fileService.save(files, 'test/images');
      await expect(fn()).rejects.toThrow(FileMessage.INVALID_FILE_NAME);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(Object.values(Client._buckets)).toHaveLength(0);
    });
  });

  describe('list', () => {
    it('should list files and directories inside a directory', async () => {
      const files = await buildFiles(5);
      await fileService.save([files[0]], 'test');
      await fileService.save([files[1], files[2]], 'test/images');
      await fileService.save([files[3], files[4]], 'test/images/somedirectory');

      const ret = await fileService.list('test/images');

      expect(Array.isArray(ret)).toBeTruthy();
      expect(ret).toHaveLength(3);
      expect(ret[0]).toMatch(/^test\\images\\\d+-\d+\.jpg$/);
      expect(ret[1]).toMatch(/^test\\images\\\d+-\d+\.jpg$/);
      expect(ret[2]).toMatch(/^test\\images\\somedirectory\\$/);
    });

    it('should return empty list when directory does not exists', async () => {
      const ret = await fileService.list('test/images');
      expect(ret).toEqual([]);
    });

    it('should fail when directory is null', async () => {
      const filepath = path.join(__dirname, 'test', 'caramelo.jpg');
      const file = await createMockFile(filepath);

      const fn = () => fileService.list(null);

      await expect(fn()).rejects.toThrow(FileMessage.DIRECTORY_NOT_DEFINED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });

    it('should fail when directory has invalid type', async () => {
      const filepath = path.join(__dirname, 'test', 'caramelo.jpg');
      const file = await createMockFile(filepath);

      const fn = () => fileService.list(true as unknown as string);

      await expect(fn()).rejects.toThrow(FileMessage.INVALID_DIRECTORY_NAME);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });
  });

  describe('get', () => {
    it('should get files', async () => {
      const files = await buildFiles(2);
      await fileService.save(files, 'test');
      const filenames = await fileService.list('test');

      const buffers = [
        await fileService.get(filenames[0]),
        await fileService.get(filenames[1]),
      ];
      expect(buffers[0]).toBeDefined();
      expect(buffers[1]).toBeDefined();

      expect(files[0].buffer.byteLength).toEqual(buffers[0].byteLength);
      expect(files[1].buffer.byteLength).toEqual(buffers[1].byteLength);

      expect(Buffer.compare(files[0].buffer, buffers[0])).toEqual(0);
      expect(Buffer.compare(files[1].buffer, buffers[1])).toEqual(0);
    });

    it('should fail if file does not exists', async () => {
      const files = await buildFiles(1);
      await fileService.save(files, 'test');

      const fn = () => fileService.get('notexists');

      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(FileMessage.FILE_NOT_FOUND);
    });

    it('should fail if objectname is null', async () => {
      const files = await buildFiles(1);
      await fileService.save(files, 'test');

      const fn = () => fileService.get(null);

      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow(FileMessage.NAME_NOT_DEFINED);
    });

    it('should fail if objectname has invalid type', async () => {
      const files = await buildFiles(1);
      await fileService.save(files, 'test');

      const fn = () => fileService.get(true as unknown as string);

      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow(FileMessage.INVALID_FILE_NAME);
    });
  });

  describe('delete', () => {
    it('should delete files', async () => {
      const files = await buildFiles(5);
      await fileService.save([files[0]], 'test');
      await fileService.save([files[1], files[2]], 'test/images');
      await fileService.save([files[3], files[4]], 'test/images/somedirectory');
      const fileBefore = await fileService.list('');

      const ret = await fileService.delete([filePaths[2]]);

      expect(ret).toEqual(true);
      const fileAfter = await fileService.list('');
      expect(fileAfter).toEqual([
        fileBefore[0],
        fileBefore[1],
        fileBefore[3],
        fileBefore[4],
      ]);
    });

    it('should not fail if fails does not exists', async () => {
      const files = await buildFiles(5);
      await fileService.save([files[0]], 'test');
      const fileBefore = await fileService.list('');

      const ret = await fileService.delete([filePaths[2]]);

      expect(ret).toEqual(true);
      const filesAfter = await fileService.list('');
      expect(filesAfter).toEqual(fileBefore);
    });

    it('should fail if objects parameter is null', async () => {
      const files = await buildFiles(5);
      await fileService.save([files[0]], 'test');
      const filesBefore = await fileService.list('');

      const fn = () => fileService.delete(null);

      await expect(fn()).rejects.toThrow(FileMessage.FILES_NOT_DEFINED);
      await expect(fn()).rejects.toThrow(BadRequestException);

      const filesAfter = await fileService.list('');
      expect(filesBefore).toEqual(filesAfter);
    });

    it('should fail if a item of objects parameter is null', async () => {
      const files = await buildFiles(1);
      await fileService.save([files[0]], 'test');
      const filesBefore = await fileService.list('');

      const fn = () => fileService.delete([null]);

      await expect(fn()).rejects.toThrow(FileMessage.INVALID_FILE_NAME);
      await expect(fn()).rejects.toThrow(BadRequestException);

      const filesAfter = await fileService.list('');
      expect(filesBefore).toEqual(filesAfter);
    });

    it('should fail bjects parameter has invalid type', async () => {
      const files = await buildFiles(1);
      await fileService.save([files[0]], 'test');
      const filesBefore = await fileService.list('');

      const fn = () => fileService.delete(true as unknown as string[]);

      await expect(fn()).rejects.toThrow(FileMessage.INVALID_FILE_NAMES);
      await expect(fn()).rejects.toThrow(BadRequestException);

      const filesAfter = await fileService.list('');
      expect(filesBefore).toEqual(filesAfter);
    });

    it('should fail if a item of objects parameter has invalid type', async () => {
      const files = await buildFiles(1);
      await fileService.save([files[0]], 'test');
      const filesBefore = await fileService.list('');

      const fn = () => fileService.delete([true as unknown as string]);

      await expect(fn()).rejects.toThrow(FileMessage.INVALID_FILE_NAME);
      await expect(fn()).rejects.toThrow(BadRequestException);

      const filesAfter = await fileService.list('');
      expect(filesBefore).toEqual(filesAfter);
    });
  });
});
