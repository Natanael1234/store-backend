import { TestImages } from '../../../../../test/images/test-images';
import { isMulterFile } from './is-valid-multer-file-fn';

describe('isMulterFile', () => {
  it('should be defined', () => {
    expect(isMulterFile).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof isMulterFile).toEqual('function');
  });

  it('should return true when receives valid file', async () => {
    const [file] = await TestImages.buildFiles(1);
    expect(isMulterFile(file)).toEqual(true);
  });

  it('should return false when receives number', async () => {
    const [file] = await TestImages.buildFiles(1);
    expect(isMulterFile(1 as unknown as Express.Multer.File)).toEqual(false);
  });

  it('should return false when receives boolean', async () => {
    const [file] = await TestImages.buildFiles(1);
    expect(isMulterFile(true as unknown as Express.Multer.File)).toEqual(false);
  });

  it('should return false when receives string', async () => {
    const [file] = await TestImages.buildFiles(1);
    expect(isMulterFile('{}' as unknown as Express.Multer.File)).toEqual(false);
  });

  it('should return false when receives array', async () => {
    const [file] = await TestImages.buildFiles(1);
    expect(isMulterFile([] as unknown as Express.Multer.File)).toEqual(false);
  });

  describe('file.originalname', () => {
    it('should return false when receives file.originalname is not defined', async () => {
      const [file] = await TestImages.buildFiles(1);
      delete file.originalname;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.originalname is null', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.originalname = null;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.originalname is undefined', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.originalname = undefined;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.originalname is number', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.originalname = 1 as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.originalname is boolean', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.originalname = true as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.originalname is array', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.originalname = [] as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.originalname is object', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.originalname = {} as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });
  });

  describe('file.encoding', () => {
    it('should return false when receives file.encoding is not defined', async () => {
      const [file] = await TestImages.buildFiles(1);
      delete file.encoding;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.encoding is null', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.encoding = null;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.encoding is undefined', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.encoding = undefined;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.encoding is number', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.encoding = 1 as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.encoding is boolean', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.encoding = true as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.encoding is array', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.encoding = [] as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.encoding is object', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.encoding = {} as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });
  });

  describe('file.mimetype', () => {
    it('should return false when receives file.mimetype is not defined', async () => {
      const [file] = await TestImages.buildFiles(1);
      delete file.mimetype;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.mimetype is null', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = null;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.mimetype is undefined', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = undefined;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.mimetype is number', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = 1 as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.mimetype is boolean', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = true as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.mimetype is array', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = [] as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.mimetype is object', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = {} as unknown as string;
      expect(isMulterFile(file)).toEqual(false);
    });
  });

  describe('file.size', () => {
    it('should return false when receives file.size is not defined', async () => {
      const [file] = await TestImages.buildFiles(1);
      delete file.size;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is null', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = null;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is undefined', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = undefined;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is negative number', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = -1;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is float', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = 1.1;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is boolean', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = true as unknown as number;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is string', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = '1' as unknown as number;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is array', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = [] as unknown as number;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.size is object', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.size = {} as unknown as number;
      expect(isMulterFile(file)).toEqual(false);
    });
  });

  describe('file.buffer', () => {
    it('should return false when receives file.buffer is not defined', async () => {
      const [file] = await TestImages.buildFiles(1);
      delete file.buffer;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.buffer is null', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.buffer = null;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.buffer is undefined', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.buffer = undefined;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.buffer is number', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.buffer = 1 as unknown as Buffer;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.buffer is boolean', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.buffer = true as unknown as Buffer;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.buffer is string', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.buffer = 'invalid' as unknown as Buffer;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.buffer is array', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.buffer = [] as unknown as Buffer;
      expect(isMulterFile(file)).toEqual(false);
    });

    it('should return false when receives file.buffer is object', async () => {
      const [file] = await TestImages.buildFiles(1);
      file.buffer = {} as unknown as Buffer;
      expect(isMulterFile(file)).toEqual(false);
    });
  });
});
