import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../.jest/test-config.module';
import { Client } from '../../../../../__mocks__/minio';
import { TestImages } from '../../../../../test/images/test-images';
import { StorageMessage as StorageMessageClass } from '../../messages/storage/storage.messages';
import { CloudStorageService } from './cloud-storage.service';

const StorageMessage = new StorageMessageClass();

jest.mock('minio');

function validateBuckets(
  expectedBuckets: {
    name: string;
    expectedFiles: { name: string; size: number }[];
  }[],
) {
  const buckets = Client._getBucketsSnapshot();
  expect(buckets).toBeDefined();
  expect(Object.keys(buckets)).toHaveLength(expectedBuckets.length);
  for (let i = 0; i < expectedBuckets.length; i++) {
    const expectedBucket = expectedBuckets[i];
    const bucket = buckets[expectedBucket.name];
    expect(bucket).toBeDefined();
    expect(bucket).toHaveLength(expectedBucket.expectedFiles.length);
    for (let j = 0; j < expectedBucket.expectedFiles.length; j++) {
      const expectedFile = expectedBucket.expectedFiles[j];
      const bucketFile = bucket[j];
      expect(bucketFile.name).toEqual(expectedFile.name);
      expect(bucketFile.size).toEqual(expectedFile.size);
    }
  }
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

  describe('getUniqueFilename', () => {
    it('should generate unique filename', async () => {
      const filename1 = fileService.generateUniqueObjectname('image.jpg');
      const filename2 = fileService.generateUniqueObjectname('image.jpg');
      const filename3 = fileService.generateUniqueObjectname('file.txt');
      expect(filename1).not.toEqual(filename2);
      expect(filename1).not.toEqual(filename3);
      expect(filename2).not.toEqual(filename3);
      expect(filename1.endsWith('.jpg')).toBeTruthy();
      expect(filename2.endsWith('.jpg')).toBeTruthy();
      expect(filename3.endsWith('.txt')).toBeTruthy();
    });
  });

  describe('save', () => {
    it('should save file', async () => {
      const [file1, file2] = await TestImages.buildFiles(2);
      const ret1 = await fileService.save(
        file1,
        'test/images/33445-342455.jpg',
      );
      expect(ret1).toEqual(undefined);
      const ret2 = await fileService.save(
        file2,
        'test/images/45367-324565465.png',
      );
      expect(ret2).toEqual(undefined);
      validateBuckets([
        {
          name: 'test-store-bucket',
          expectedFiles: [
            { name: 'test/images/33445-342455.jpg', size: 5921 },
            { name: 'test/images/45367-324565465.png', size: 191777 },
          ],
        },
      ]);
    });

    describe('files', () => {
      it('should reject when file is null', async () => {
        const fn = () => fileService.save(null, 'test/images');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should reject when file is undefined', async () => {
        const fn = () => fileService.save(undefined, 'test/images');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should reject when file is int', async () => {
        const fn = () =>
          fileService.save(1 as unknown as Express.Multer.File, 'test/images');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should reject when file is boolean', async () => {
        const fn = () =>
          fileService.save([] as unknown as Express.Multer.File, 'test/images');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should reject when file is object', async () => {
        const fn = () =>
          fileService.save({} as unknown as Express.Multer.File, 'test/images');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should reject when file is string', async () => {
        const fn = () =>
          fileService.save(
            'invalid' as unknown as Express.Multer.File,
            'test/images',
          );
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should reject when file is array', async () => {
        const fn = () =>
          fileService.save(
            true as unknown as Express.Multer.File,
            'test/images',
          );
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should reject when file buffer has wrong type', async () => {
        const [file1] = await TestImages.buildFiles(1);
        file1.buffer = true as unknown as Buffer;
        const fn = () => fileService.save(file1, 'test/images');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_DATA_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });
    });

    describe('objectName', () => {
      it('should reject when objectName is null', async () => {
        const [file1] = await TestImages.buildFiles(1);
        const fn = () => fileService.save(file1, null);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is undefined', async () => {
        const [file1] = await TestImages.buildFiles(1);
        const fn = () => fileService.save(file1, undefined);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is number', async () => {
        const [file1] = await TestImages.buildFiles(1);
        const fn = () => fileService.save(file1, 1 as unknown as string);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is boolean', async () => {
        const [file1] = await TestImages.buildFiles(1);
        const fn = () => fileService.save(file1, true as unknown as string);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is invalid string', async () => {
        const [file1] = await TestImages.buildFiles(1);
        const fn = () => fileService.save(file1, '//|');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is array', async () => {
        const [file1] = await TestImages.buildFiles(1);
        const fn = () => fileService.save(file1, [] as unknown as string);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is object', async () => {
        const [file1] = await TestImages.buildFiles(1);
        const fn = () => fileService.save(file1, {} as unknown as string);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });
    });
  });

  describe('list', () => {
    it('should list files and directories inside a directory', async () => {
      const files = await TestImages.buildFiles(5);
      await fileService.save(files[0], 'test/3424-34255.jpg');
      await fileService.save(files[1], 'test/324554-354365.png');
      await fileService.save(files[2], 'test/images/342845954-3423456.jpg');
      await fileService.save(
        files[3],
        'test/images/somedirectory/344234-34344.png',
      );
      await fileService.save(
        files[4],
        'test/images/somedirectory/342345-3245.png',
      );

      const ret = await fileService.list('test/images/');

      expect(ret).toEqual([
        'test/images/342845954-3423456.jpg',
        'test/images/somedirectory/',
      ]);
    });

    it('should return empty list when directory does not exists', async () => {
      const ret = await fileService.list('test/images');
      expect(ret).toEqual([]);
    });

    it('should reject when directory is null', async () => {
      const fn = () => fileService.list(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      await expect(fn()).rejects.toThrow(StorageMessage.DIRECTORY_REQUIRED);
    });

    it('should reject when directory is undefined', async () => {
      const fn = () => fileService.list(undefined);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      await expect(fn()).rejects.toThrow(StorageMessage.DIRECTORY_REQUIRED);
    });

    it('should reject when directory is number', async () => {
      const fn = () => fileService.list(1 as unknown as string);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      await expect(fn()).rejects.toThrow(StorageMessage.DIRECTORY_INVALID);
    });

    it('should reject when directory is boolean', async () => {
      const fn = () => fileService.list(true as unknown as string);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      await expect(fn()).rejects.toThrow(StorageMessage.DIRECTORY_INVALID);
    });

    it('should reject when directory is array', async () => {
      const fn = () => fileService.list([] as unknown as string);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      await expect(fn()).rejects.toThrow(StorageMessage.DIRECTORY_INVALID);
    });

    it('should reject when directory is object', async () => {
      const fn = () => fileService.list({} as unknown as string);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      await expect(fn()).rejects.toThrow(StorageMessage.DIRECTORY_INVALID);
    });
  });

  describe('get', () => {
    it('should get object ', async () => {
      const files = await TestImages.buildFiles(2);
      await fileService.save(files[0], 'test/3424-34255.jpg');
      await fileService.save(files[1], 'test/324554-354365.png');
      const objects = await fileService.list('test');
      const buffers = [
        await fileService.get(objects[0]),
        await fileService.get(objects[1]),
      ];
      expect(buffers[0]).toBeDefined();
      expect(buffers[1]).toBeDefined();
      expect(files[0].buffer.byteLength).toEqual(buffers[0].byteLength);
      expect(files[1].buffer.byteLength).toEqual(buffers[1].byteLength);
      expect(Buffer.compare(files[0].buffer, buffers[0])).toEqual(0);
      expect(Buffer.compare(files[1].buffer, buffers[1])).toEqual(0);
    });

    it('should reject when file does not exists', async () => {
      const [file] = await TestImages.buildFiles(1);
      await fileService.save(file, 'test/3424-34255.jpg');
      const fn = () => fileService.get('test/inexsistent.jpg');
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NOT_FOUND);
    });

    describe('objectName', () => {
      it('should reject when objectName is null', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const fn = () => fileService.get(null);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
      });

      it('should reject when objectName is undefined', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const fn = () => fileService.get(undefined);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
      });

      it('should reject when objectName is number', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const fn = () => fileService.get(1 as unknown as string);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
      });

      it('should reject when objectName is boolean', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const fn = () => fileService.get(true as unknown as string);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
      });

      it('should reject when objectName is array', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const fn = () => fileService.get([] as unknown as string);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
      });

      it('should reject when objectName is object', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const fn = () => fileService.get({} as unknown as string);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
      });
    });
  });

  describe('delete', () => {
    function listFiles(): string[] {
      return Client._getBucketSnapshot('test-store-bucket').map(
        (item) => item.name,
      );
    }

    it('should delete files', async () => {
      const files = await TestImages.buildFiles(5);
      await fileService.save(files[0], 'test/3424-34255.jpg');
      await fileService.save(files[1], 'test/324554-354365.png');
      await fileService.save(files[2], 'test/images/342845954-3423456.jpg');
      await fileService.save(
        files[3],
        'test/images/somedirectory/344234-34344.png',
      );
      await fileService.save(
        files[4],
        'test/images/somedirectory/342345-3245.png',
      );
      const fileBefore = listFiles();
      const ret = await fileService.delete([fileBefore[2]]);
      expect(ret).toBeUndefined();
      const fileAfter = listFiles();
      expect(fileAfter).toEqual([
        fileBefore[0],
        fileBefore[1],
        fileBefore[3],
        fileBefore[4],
      ]);
    });

    it('should not fail when fails does not exists', async () => {
      const files = await TestImages.buildFiles(5);
      await fileService.save(files[0], 'test/3424-34255.jpg');
      await fileService.save(files[1], 'test/324554-354365.png');
      await fileService.save(files[2], 'test/images/342845954-3423456.jpg');
      await fileService.save(
        files[3],
        'test/images/somedirectory/344234-34344.png',
      );
      await fileService.save(
        files[4],
        'test/images/somedirectory/342345-3245.png',
      );
      const fileBefore = listFiles();
      const ret = await fileService.delete(['test/inexistent-file.jpg']);
      expect(ret).toBeUndefined();
      const filesAfter = listFiles();
      expect(filesAfter).toEqual(fileBefore);
    });

    describe('objectIList', () => {
      it('should reject when objectsList parameter is null', async () => {
        const files = await TestImages.buildFiles(2);
        await fileService.save(files[0], 'test/3424-34255.jpg');
        await fileService.save(files[1], 'test/images/342845954-3423456.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete(null);
        await expect(fn()).rejects.toThrow(
          StorageMessage.OBJECT_NAME_LIST_REQUIRED,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when objectsList parameter is undeined', async () => {
        const files = await TestImages.buildFiles(2);
        await fileService.save(files[0], 'test/3424-34255.jpg');
        await fileService.save(files[1], 'test/images/342845954-3423456.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete(undefined);
        await expect(fn()).rejects.toThrow(
          StorageMessage.OBJECT_NAME_LIST_REQUIRED,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when objectsList parameter is number', async () => {
        const files = await TestImages.buildFiles(2);
        await fileService.save(files[0], 'test/3424-34255.jpg');
        await fileService.save(files[1], 'test/images/342845954-3423456.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete(1 as unknown as string[]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when objectsList parameter is boolean', async () => {
        const files = await TestImages.buildFiles(2);
        await fileService.save(files[0], 'test/3424-34255.jpg');
        await fileService.save(files[1], 'test/images/342845954-3423456.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete(true as unknown as string[]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when objectsList parameter is string', async () => {
        const files = await TestImages.buildFiles(2);
        await fileService.save(files[0], 'test/3424-34255.jpg');
        await fileService.save(files[1], 'test/images/342845954-3423456.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete('[]' as unknown as string[]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when objectsList parameter is object', async () => {
        const files = await TestImages.buildFiles(2);
        await fileService.save(files[0], 'test/3424-34255.jpg');
        await fileService.save(files[1], 'test/images/342845954-3423456.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete({} as unknown as string[]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });
    });

    describe('objectList item', () => {
      it('should reject when a item of objects parameter is null', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete([null]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when a item of objects parameter is undefined', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete([undefined]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when a item of objects parameter item is mumber', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete([1 as unknown as string]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when a item of objects parameter item is boolean', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete([true as unknown as string]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when a item of objects parameter item is array', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete([[] as unknown as string]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });

      it('should reject when a item of objects parameter item is object', async () => {
        const [file] = await TestImages.buildFiles(1);
        await fileService.save(file, 'test/3424-34255.jpg');
        const filesBefore = listFiles();
        const fn = () => fileService.delete([{} as unknown as string]);
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const filesAfter = listFiles();
        expect(filesBefore).toEqual(filesAfter);
      });
    });
  });

  describe('copy', () => {
    it('should copy a file', async () => {
      const [file1, file2] = await TestImages.buildFiles(2);
      await fileService.save(file1, 'test/images/33445-342455.jpg');
      await fileService.save(file2, 'test/images/45367-324565465.png');
      const ret = await fileService.copy(
        'test/images/subfolder/23434554-34645.jpg',
        'test/images/33445-342455.jpg',
      );
      expect(ret).toBeUndefined();
      validateBuckets([
        {
          name: 'test-store-bucket',
          expectedFiles: [
            { name: 'test/images/33445-342455.jpg', size: 5921 },
            { name: 'test/images/45367-324565465.png', size: 191777 },
            { name: 'test/images/subfolder/23434554-34645.jpg', size: 5921 },
          ],
        },
      ]);
      const buffers = Client._getBucketBuffers('test-store-bucket');
      expect(buffers[0].buffer.compare(buffers[1].buffer)).not.toEqual(0);
      expect(buffers[0].buffer.compare(buffers[2].buffer)).toEqual(0);
    });

    it('should copy a file overwriting another file', async () => {
      const [file1, file2, file3] = await TestImages.buildFiles(3);
      await fileService.save(file1, 'test/images/33445-342455.jpg');
      await fileService.save(file2, 'test/images/45367-324565465.png');
      await fileService.save(file3, 'test/images/54455-4554455.png');
      const ret = await fileService.copy(
        'test/images/54455-4554455.png',
        'test/images/33445-342455.jpg',
      );
      expect(ret).toBeUndefined();
      validateBuckets([
        {
          name: 'test-store-bucket',
          expectedFiles: [
            { name: 'test/images/33445-342455.jpg', size: 5921 },
            { name: 'test/images/45367-324565465.png', size: 191777 },
            { name: 'test/images/54455-4554455.png', size: 5921 },
          ],
        },
      ]);
      const buffers = Client._getBucketBuffers('test-store-bucket');
      expect(buffers[0].buffer.compare(buffers[1].buffer)).not.toEqual(0);
      expect(buffers[0].buffer.compare(buffers[2].buffer)).toEqual(0);
    });

    it('should fail copying a inexistent file', async () => {
      const fn = () =>
        fileService.copy(
          'test/images/32434-343434.png',
          'test/images/inexistent_file.jpg',
        );
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NOT_FOUND);
      validateBuckets([{ name: 'test-store-bucket', expectedFiles: [] }]);
    });

    describe('objectName', () => {
      it('should reject when objectName is null', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.copy(null, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is undefined', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.copy(undefined, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is number', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy(1 as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is boolean', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy(true as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is invalid string', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy('dssdsddsds....  sasdfd', 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is array', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy([] as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is object', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy({} as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });
    });

    describe('sourceObject', () => {
      it('should reject when sourceObject is null', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.copy('folder/12345-67890.jpg', null);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_REQUIRED,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is undefined', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.copy('folder/12345-67890.jpg', undefined);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_REQUIRED,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is number', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy('folder/12345-67890.jpg', 1 as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is boolean', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy('folder/12345-67890.jpg', true as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is invalid string', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy('folder/12345-67890.jpg', 'dssdsddsds....  sasdfd');
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is array', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy('folder/12345-67890.jpg', [] as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is object', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.copy('folder/12345-67890.jpg', {} as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });
    });
  });

  describe('move', () => {
    it('should move a file', async () => {
      const [file1, file2] = await TestImages.buildFiles(2);
      await fileService.save(file1, 'test/images/33445-342455.jpg');
      await fileService.save(file2, 'test/images/45367-324565465.png');
      const buffers = Client._getBucketBuffers('test-store-bucket');
      const buffer1 = buffers[0].buffer;
      const buffer2 = buffers[1].buffer;
      const ret = await fileService.move(
        'test/images/subfolder/23434554-34645.jpg',
        'test/images/33445-342455.jpg',
      );
      expect(ret).toBeUndefined();
      validateBuckets([
        {
          name: 'test-store-bucket',
          expectedFiles: [
            { name: 'test/images/45367-324565465.png', size: 191777 },
            { name: 'test/images/subfolder/23434554-34645.jpg', size: 5921 },
          ],
        },
      ]);
      expect(buffers[0].buffer.compare(buffer2)).toEqual(0);
      expect(buffers[1].buffer.compare(buffer1)).toEqual(0);
    });

    it('should move a file overwriting another file', async () => {
      const [file1, file2, file3] = await TestImages.buildFiles(3);
      await fileService.save(file1, 'test/images/33445-342455.jpg');
      await fileService.save(file2, 'test/images/45367-324565465.png');
      await fileService.save(file3, 'test/images/54455-4554455.png');
      const buffers = Client._getBucketBuffers('test-store-bucket');
      const buffer1 = buffers[0].buffer;
      const buffer2 = buffers[1].buffer;
      const ret = await fileService.move(
        'test/images/54455-4554455.png',
        'test/images/33445-342455.jpg',
      );
      expect(ret).toBeUndefined();
      validateBuckets([
        {
          name: 'test-store-bucket',
          expectedFiles: [
            { name: 'test/images/45367-324565465.png', size: 191777 },
            { name: 'test/images/54455-4554455.png', size: 5921 },
          ],
        },
      ]);
      expect(buffers[0].buffer.compare(buffer2)).toEqual(0);
      expect(buffers[1].buffer.compare(buffer1)).toEqual(0);
      expect(buffers).toHaveLength(2);
      validateBuckets([
        {
          name: 'test-store-bucket',
          expectedFiles: [
            { name: 'test/images/45367-324565465.png', size: 191777 },
            { name: 'test/images/54455-4554455.png', size: 5921 },
          ],
        },
      ]);
    });

    it('should fail moving a inexistent file', async () => {
      const [file1, file2, file3] = await TestImages.buildFiles(3);
      await fileService.save(file1, 'test/images/33445-342455.jpg');
      await fileService.save(file2, 'test/images/45367-324565465.png');
      const fn = () =>
        fileService.move(
          'test/images/32434-343434.png',
          'test/images/inexistent_file.jpg',
        );
      const buffers = Client._getBucketBuffers('test-store-bucket');
      const buffer1 = buffers[0].buffer;
      const buffer2 = buffers[1].buffer;
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NOT_FOUND);
      expect(buffers[0].buffer.compare(buffer1)).toEqual(0);
      expect(buffers[1].buffer.compare(buffer2)).toEqual(0);
      expect(buffers).toHaveLength(2);
      validateBuckets([
        {
          name: 'test-store-bucket',
          expectedFiles: [
            { name: 'test/images/33445-342455.jpg', size: 5921 },
            { name: 'test/images/45367-324565465.png', size: 191777 },
          ],
        },
      ]);
    });

    describe('objectName', () => {
      it('should reject when objectName is null', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.move(null, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is undefined', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.move(undefined, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is number', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move(1 as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is boolean', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move(true as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is invalid string', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move('dssdsddsds....  sasdfd', 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is array', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move([] as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when objectName is object', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move({} as unknown as string, 'folder/12345-67890.jpg');
        await expect(fn()).rejects.toThrow(StorageMessage.OBJECT_NAME_INVALID);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });
    });

    describe('sourceObject', () => {
      it('should reject when sourceObject is null', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.move('folder/12345-67890.jpg', null);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_REQUIRED,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is undefined', async () => {
        await TestImages.buildFiles(1);
        const fn = () => fileService.move('folder/12345-67890.jpg', undefined);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_REQUIRED,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is number', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move('folder/12345-67890.jpg', 1 as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is boolean', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move('folder/12345-67890.jpg', true as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is invalid string', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move('folder/12345-67890.jpg', 'dssdsddsds....  sasdfd');
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is array', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move('folder/12345-67890.jpg', [] as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });

      it('should reject when sourceObject is object', async () => {
        await TestImages.buildFiles(1);
        const fn = () =>
          fileService.move('folder/12345-67890.jpg', {} as unknown as string);
        await expect(fn()).rejects.toThrow(
          StorageMessage.SOURCE_OBJECT_NAME_INVALID,
        );
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(Object.values(Client._getBucketsSnapshot())).toHaveLength(0);
      });
    });
  });
});
