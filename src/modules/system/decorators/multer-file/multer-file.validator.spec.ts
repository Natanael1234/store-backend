import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { TestImages } from '../../../../test/images/test-images';
import { FileMessage } from '../../messages/file/file.messages.enum';
import { IsMulterFile } from './multer-file.validator';

enum TestEnum {
  value1 = 'value1_asc',
  value2 = 'value2_desc',
  value3 = 'value3_asc',
  value4 = 'value3_desc',
}

describe('isMulterFile', () => {
  it('should be defined', () => {
    expect(IsMulterFile).toBeDefined();
  });

  it('should return a function', () => {
    expect(typeof IsMulterFile({ label: 'file' })).toEqual('function');
  });

  it('should validate when receives valid file', async () => {
    class dTO {
      @IsMulterFile({ label: 'files' })
      test: Express.Multer.File;
    }
    const [file] = await TestImages.buildFiles(1);
    const dto = plainToInstance(dTO, {
      test: file,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should not validate when receives number', async () => {
    class dTO {
      @IsMulterFile({ label: 'files' })
      test: TestEnum[];
    }
    const dto = plainToInstance(dTO, { test: 1 });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('test');
    expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
    expect(errors[0].target).toEqual({ test: 1 });
    expect(errors[0].value).toEqual(1);
  });

  it('should not validate when receives boolean', async () => {
    class dTO {
      @IsMulterFile({ label: 'files' })
      test: TestEnum[];
    }
    const dto = plainToInstance(dTO, { test: true });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('test');
    expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
    expect(errors[0].target).toEqual({ test: true });
    expect(errors[0].value).toEqual(true);
  });

  it('should not validate when receives string', async () => {
    class dTO {
      @IsMulterFile({ label: 'files' })
      test: TestEnum[];
    }
    const dto = plainToInstance(dTO, { test: '{}' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('test');
    expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
    expect(errors[0].target).toEqual({ test: '{}' });
    expect(errors[0].value).toEqual('{}');
  });

  it('should not validate when receives array', async () => {
    class dTO {
      @IsMulterFile({ label: 'files' })
      test: TestEnum[];
    }
    const dto = plainToInstance(dTO, { test: [] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('test');
    expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
    expect(errors[0].target).toEqual({ test: [] });
    expect(errors[0].value).toEqual([]);
  });

  describe('options.allowNull', () => {
    it('should validate when receives null and allowNull = true', async () => {
      class dTO {
        @IsMulterFile({
          label: 'files',
          allowNull: true,
          allowUndefined: false,
        })
        test: Express.Multer.File;
      }
      const [file] = await TestImages.buildFiles(1);
      const dto = plainToInstance(dTO, {
        test: null,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should not validate when receives null and allowNull = false', async () => {
      class dTO {
        @IsMulterFile({ label: 'files', allowNull: false })
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: null });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(
        FileMessage.FILE_NOT_DEFINED,
      );
      expect(errors[0].target).toEqual({ test: null });
      expect(errors[0].value).toEqual(null);
    });

    it('should not validate when receives null and allowNull = null', async () => {
      class dTO {
        @IsMulterFile({ label: 'files', allowNull: null })
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: null });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(
        FileMessage.FILE_NOT_DEFINED,
      );
      expect(errors[0].target).toEqual({ test: null });
      expect(errors[0].value).toEqual(null);
    });

    it('should not validate when receives null and allowNull = undefined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files', allowNull: undefined })
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: null });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(
        FileMessage.FILE_NOT_DEFINED,
      );
      expect(errors[0].target).toEqual({ test: null });
      expect(errors[0].value).toEqual(null);
    });
  });

  describe('options.allowUndefined', () => {
    it('should validate when receives undefined and allowUndefined = true', async () => {
      class dTO {
        @IsMulterFile({
          label: 'files',
          allowUndefined: true,
          allowNull: false,
        })
        test: Express.Multer.File;
      }
      const [file] = await TestImages.buildFiles(1);
      const dto = plainToInstance(dTO, {
        test: undefined,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should not validate when receives undefined and allowUndefined = false', async () => {
      class dTO {
        @IsMulterFile({ label: 'files', allowUndefined: false })
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: undefined });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(
        FileMessage.FILE_NOT_DEFINED,
      );
      expect(errors[0].target).toEqual({ test: undefined });
      expect(errors[0].value).toEqual(undefined);
    });

    it('should not validate when receives undefined and allowUndefined = null', async () => {
      class dTO {
        @IsMulterFile({ label: 'files', allowUndefined: null })
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: undefined });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(
        FileMessage.FILE_NOT_DEFINED,
      );
      expect(errors[0].target).toEqual({ test: undefined });
      expect(errors[0].value).toEqual(undefined);
    });

    it('should not validate when receives undefined and allowUndefined = undefined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files', allowUndefined: undefined })
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: undefined });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(
        FileMessage.FILE_NOT_DEFINED,
      );
      expect(errors[0].target).toEqual({ test: undefined });
      expect(errors[0].value).toEqual(undefined);
    });
  });

  describe('file.originalname', () => {
    it('should not validate when receives file.originalname is not defined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      delete file.originalname;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.originalname is null', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.originalname = null;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.originalname is undefined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.originalname = undefined;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.originalname is number', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.originalname = 1 as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.originalname is boolean', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.originalname = true as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.originalname is array', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.originalname = [] as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.originalname is object', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.originalname = {} as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });
  });

  describe('file.encoding', () => {
    it('should not validate when receives file.encoding is not defined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      delete file.encoding;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.encoding is null', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.encoding = null;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.encoding is undefined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.encoding = undefined;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.encoding is number', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.encoding = 1 as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.encoding is boolean', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.encoding = true as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.encoding is array', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.encoding = [] as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.encoding is object', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.encoding = {} as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });
  });

  describe('file.mimetype', () => {
    it('should not validate when receives file.mimetype is not defined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      delete file.mimetype;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.mimetype is null', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = null;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.mimetype is undefined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = undefined;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.mimetype is number', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = 1 as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.mimetype is boolean', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = true as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.mimetype is array', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = [] as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.mimetype is object', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.mimetype = {} as unknown as string;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });
  });

  describe('file.size', () => {
    it('should not validate when receives file.size is not defined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      delete file.size;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is null', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = null;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is undefined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = undefined;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is negative number', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = -1;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is float', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = 1.1;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is boolean', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = true as unknown as number;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is string', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = '1' as unknown as number;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is array', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = [] as unknown as number;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.size is object', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.size = {} as unknown as number;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });
  });

  describe('file.buffer', () => {
    it('should not validate when receives file.buffer is number', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.buffer = 1 as unknown as Buffer;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.buffer is boolean', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.buffer = true as unknown as Buffer;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.buffer is null', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.buffer = null;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.buffer is undefined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.buffer = undefined;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.buffer is not defined', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      delete file.buffer;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.buffer is string', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.buffer = 'invalid' as unknown as Buffer;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.buffer is array', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.buffer = [] as unknown as Buffer;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });

    it('should not validate when receives file.buffer is object', async () => {
      class dTO {
        @IsMulterFile({ label: 'files' })
        test: TestEnum[];
      }
      const [file] = await TestImages.buildFiles(1);
      file.buffer = {} as unknown as Buffer;
      const dto = plainToInstance(dTO, { test: file });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isFile).toEqual(FileMessage.INVALID_FILE);
      expect(errors[0].target).toEqual({ test: file });
      expect(errors[0].value).toEqual(file);
    });
  });
});
