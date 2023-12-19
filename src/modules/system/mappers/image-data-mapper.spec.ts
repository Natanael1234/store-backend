import { UnprocessableEntityException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { TestImages } from '../../../test/images/test-images';
import { SaveImageItemDto } from '../dtos/save-image-item-dto/save-image-item.dto';
import { SaveMetadataItemDto } from '../dtos/save-metadata-item/save-metadata-item.dto';
import { FileMessage } from '../messages/file/file.messages.enum';
import { ImagesMetadataMessage } from '../messages/images-metadata/images-metadata.messages.enum';
import { imageDataMapper } from './image-data-mapper';

describe('imageDataMapper', () => {
  it('should be defined', () => {
    expect(imageDataMapper).toBeDefined();
  });

  it('should be defined a function', () => {
    expect(typeof imageDataMapper).toEqual('function');
  });

  it('should be defined', () => {
    expect(imageDataMapper).toBeDefined();
  });

  it('should map files and metadata to image data', async () => {
    const files = await TestImages.buildFiles(3);

    const imageId = uuidv4();
    const metadata: SaveMetadataItemDto[] = [
      {
        name: 'Name 1',
        description: 'Description image 1',
        main: true,
        delete: false,
        active: true,
        fileIdx: 0,
      },
      { fileIdx: 2 },
      {
        imageId,
      },
    ];
    const expectedResult: SaveImageItemDto[] = [
      {
        name: 'Name 1',
        description: 'Description image 1',
        main: true,
        delete: false,
        active: true,
        file: files[0],
      },
      {
        file: files[2],
      },
      {
        imageId,
      },
      {
        file: files[1],
      },
    ];
    const result = imageDataMapper(files, metadata);
    expect(result).toEqual(expectedResult);
  });

  describe('files param', () => {
    it('should reject when files is null', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () => imageDataMapper(null, metadata);
      expect(fn).toThrow(FileMessage.FILES_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files is undefined', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () => imageDataMapper(undefined, metadata);
      expect(fn).toThrow(FileMessage.FILES_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files is number', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper(1 as unknown as Express.Multer.File[], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE_LIST);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files is boolean', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper(true as unknown as Express.Multer.File[], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE_LIST);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files is string', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper('[]' as unknown as Express.Multer.File[], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE_LIST);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files is object', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper({} as unknown as Express.Multer.File[], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE_LIST);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files item is null', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper([null as unknown as Express.Multer.File], metadata);
      expect(fn).toThrow(FileMessage.FILE_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files item is undefined', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper(
          [undefined as unknown as Express.Multer.File],
          metadata,
        );
      expect(fn).toThrow(FileMessage.FILE_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files item is number', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper([1 as unknown as Express.Multer.File], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files item is boolean', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper([true as unknown as Express.Multer.File], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files item is string', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper(['{}' as unknown as Express.Multer.File], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when files item is array', async () => {
      const metadata: SaveMetadataItemDto[] = [{ fileIdx: 0 }];
      const fn = () =>
        imageDataMapper([[] as unknown as Express.Multer.File], metadata);
      expect(fn).toThrow(FileMessage.INVALID_FILE);
      expect(fn).toThrow(UnprocessableEntityException);
    });
  });

  describe('metadataArr param', () => {
    it('should reject when metadataArr is null', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () => imageDataMapper(files, null);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr is undefined', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () => imageDataMapper(files, undefined);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr is number', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, 1 as unknown as SaveMetadataItemDto[]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_INVALID);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr is boolean', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, true as unknown as SaveMetadataItemDto[]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_INVALID);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr is string', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, '[]' as unknown as SaveMetadataItemDto[]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_INVALID);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr is object', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, {} as unknown as SaveMetadataItemDto[]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_INVALID);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr item is null', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () => imageDataMapper(files, [null]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr item is undefined', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () => imageDataMapper(files, [undefined]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr item is number', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, [1 as unknown as SaveMetadataItemDto]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr item is boolean', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, [true as unknown as SaveMetadataItemDto]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr item is string', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, ['{}' as unknown as SaveMetadataItemDto]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE);
      expect(fn).toThrow(UnprocessableEntityException);
    });

    it('should reject when metadataArr item is array', async () => {
      const files = await TestImages.buildFiles(1);
      const fn = () =>
        imageDataMapper(files, [[] as unknown as SaveMetadataItemDto]);
      expect(fn).toThrow(ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE);
      expect(fn).toThrow(UnprocessableEntityException);
    });
  });
});
