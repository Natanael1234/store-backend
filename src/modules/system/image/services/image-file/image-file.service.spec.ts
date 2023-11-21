import { UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getTestingModule } from '../../../../../.jest/test-config.module';
import { TestImages } from '../../../../../test/images/test-images';
import { FileMessage } from '../../../messages/file/file.messages.enum';
import { ImageService } from './image-file.service';

describe('ProductImageService', () => {
  let module: TestingModule;
  let service: ImageService;

  beforeEach(async () => {
    module = await getTestingModule();

    service = module.get<ImageService>(ImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail', async () => {
      const files = await TestImages.buildFiles(1);
      const file = files[0];

      const thumbnail = await service.generateThumbnail(file);

      expect(thumbnail).toBeDefined();
      expect(Buffer.byteLength(thumbnail.buffer)).toEqual(2709);
      expect(thumbnail.size).toEqual(2709);
      expect(thumbnail.encoding).toEqual(file.encoding);
      expect(thumbnail.originalname).toEqual('example.jpeg');
      expect(thumbnail.fieldname).toEqual(file.fieldname);
      expect(thumbnail.filename).toEqual(file.filename);
      expect(thumbnail.mimetype).toEqual('image/jpeg');
      expect(thumbnail.path).toEqual(file.path);
      expect(thumbnail.destination).toEqual(file.destination);
    });

    it('should fail when file is not defined', async () => {
      const fn = () => service.generateThumbnail(null);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      await expect(fn).rejects.toThrow(FileMessage.FILE_NOT_DEFINED);
    });

    it('should fail when file original name has invalid type', async () => {
      const files = await TestImages.buildFiles(1);
      const file = files[0];
      file.originalname = true as unknown as string;

      const fn = () => service.generateThumbnail(file);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      await expect(fn).rejects.toThrow(FileMessage.INVALID_FILE);
    });

    it('should fail when file original name is not defined', async () => {
      const files = await TestImages.buildFiles(1);
      const file = files[0];
      file.originalname = null;

      const fn = () => service.generateThumbnail(file);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      await expect(fn).rejects.toThrow(FileMessage.FILE_NAME_NOT_DEFINED);
    });

    it('should fail when file buffer is not defined', async () => {
      const files = await TestImages.buildFiles(1);
      const file = files[0];
      file.buffer = null;

      const fn = () => service.generateThumbnail(file);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      await expect(fn).rejects.toThrow(FileMessage.INVALID_FILE);
    });

    it('should fail when file buffer has invalid type', async () => {
      const files = await TestImages.buildFiles(1);
      const file = files[0];
      file.buffer = true as unknown as Buffer;

      const fn = () => service.generateThumbnail(file);

      await expect(fn).rejects.toThrow(UnprocessableEntityException);
      await expect(fn).rejects.toThrow(FileMessage.INVALID_FILE);
    });
  });

  describe('changeFilenameExtension', () => {
    it('should change filename extension', async () => {
      const result = service.changeFilenameExtension(
        'test/file.something.png',
        'jpeg',
      );
      expect(result).toEqual('test/file.something.jpeg');
    });

    it("should add extension when filename don't have extension", async () => {
      const result = service.changeFilenameExtension(
        'test/file.something',
        'jpeg',
      );
      expect(result).toEqual('test/file.jpeg');
    });

    it('should fail when filename is null', async () => {
      const fn = () => service.changeFilenameExtension(null, 'invalid');

      await expect(fn).toThrow(UnprocessableEntityException);
      await expect(fn).toThrow(FileMessage.FILE_NAME_NOT_DEFINED);
    });

    it('should fail when filename is ""', async () => {
      const fn = () =>
        service.changeFilenameExtension('test/file.something.png', '');

      await expect(fn).toThrow(UnprocessableEntityException);
      await expect(fn).toThrow(FileMessage.INVALID_FILE_EXTENSION);
    });

    it('should fail when extension is invalid', async () => {
      const fn = () =>
        service.changeFilenameExtension('test/file.something.png', 'invalid');

      await expect(fn).toThrow(UnprocessableEntityException);
      await expect(fn).toThrow(FileMessage.INVALID_FILE_EXTENSION);
    });
  });
});
