import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { ProductImageConfigs } from '../../../stock/product-image/configs/product-image/product-image.configs';
import { BoolMessage } from '../../messages/bool/bool.messages';
import { MutuallyExclusiveFieldsMessage as _MutuallyExclusiveFieldsMessage } from '../../messages/mutually-exclusive-fields/mutually-exclusive-fields.messages';
import { NumberMessage } from '../../messages/number/number.messages';
import { TextMessage } from '../../messages/text/text.messages';
import { UuidMessage } from '../../messages/uuid/uuid.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { SaveMetadataItemDto } from './save-metadata-item.dto';

const NameMessage = new TextMessage('name', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});
const DescriptionMessage = new TextMessage('description', {
  maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
});
const MainMessage = new BoolMessage('main');
const ActiveMessage = new BoolMessage('active');
const DeleteMessage = new BoolMessage('delete');
const ImageIdMessage = new UuidMessage('image id');
const FileIdxMessage = new NumberMessage('file index', { min: 0 });
const MutuallyExclusiveFieldsMessageFromImageId =
  new _MutuallyExclusiveFieldsMessage('imageId', 'fileIdx');
const MutuallyExclusiveFieldsMessageFromFileIdx =
  new _MutuallyExclusiveFieldsMessage('fileIdx', 'imageId');

describe('SaveMetadataItemDto', () => {
  it('should be defined', () => {
    expect(SaveMetadataItemDto).toBeDefined();
  });

  it('should accept valid SaveMetadataItemDto', async () => {
    const data: SaveMetadataItemDto = {
      name: 'Image 1',
      description: 'Description 1',
      main: true,
      active: true,
      delete: false,
      imageId: uuidv4(),
    };
    const errors = await validateFirstError(data, SaveMetadataItemDto);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(SaveMetadataItemDto, data);
    expect(dto).toEqual(data);
  });

  it('should reject invalid SaveMetadataItemDto with multiple errors', async () => {
    const imageId = uuidv4();
    const data: SaveMetadataItemDto = {
      name: true as unknown as string,
      description: [] as unknown as string,
      main: {} as unknown as true,
      active: 1 as unknown as true,
      delete: 'true' as unknown as true,
      imageId: 'not-a-valid-uuid',
      fileIdx: true as unknown as number,
    };
    const errors = await validateFirstError(data, SaveMetadataItemDto);
    expect(errors).toHaveLength(7);

    expect(errors[0].property).toEqual('name');
    expect(errors[0].value).toEqual(data.name);
    expect(errors[0].constraints).toEqual({
      isText: NameMessage.INVALID,
    });

    expect(errors[1].property).toEqual('description');
    expect(errors[1].value).toEqual(data.description);
    expect(errors[1].constraints).toEqual({
      isText: DescriptionMessage.INVALID,
    });

    expect(errors[2].property).toEqual('main');
    expect(errors[2].value).toEqual(data.main);
    expect(errors[2].constraints).toEqual({
      isBool: MainMessage.INVALID,
    });

    expect(errors[3].property).toEqual('active');
    expect(errors[3].value).toEqual(data.active);
    expect(errors[3].constraints).toEqual({
      isBool: ActiveMessage.INVALID,
    });

    expect(errors[4].property).toEqual('delete');
    expect(errors[4].value).toEqual(data.delete);
    expect(errors[4].constraints).toEqual({
      isBool: DeleteMessage.INVALID,
    });

    expect(errors[5].property).toEqual('imageId');
    expect(errors[5].value).toEqual(data.imageId);
    expect(errors[5].constraints).toEqual({
      isMutuallyExclusive:
        MutuallyExclusiveFieldsMessageFromImageId.BOTH_DEFINED,
    });

    expect(errors[6].property).toEqual('fileIdx');
    expect(errors[6].value).toEqual(data.fileIdx);
    expect(errors[6].constraints).toEqual({
      isMutuallyExclusive:
        MutuallyExclusiveFieldsMessageFromFileIdx.BOTH_DEFINED,
    });
  });

  describe('name', () => {
    it('should accept when name has max allowed length', async () => {
      const data: SaveMetadataItemDto = {
        name: 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH),
        description: 'Description 1',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when name is empty', async () => {
      const data: SaveMetadataItemDto = {
        name: '',
        description: 'Description 1',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when name is null', async () => {
      const data: SaveMetadataItemDto = {
        name: null,
        description: 'Description 1',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when name is undefined', async () => {
      const data: SaveMetadataItemDto = {
        name: undefined,
        description: 'Description 1',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when name is number', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: 1 as unknown as string,
        description: 'Description 1',
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('name');
      expect(errors[0].value).toEqual(data.name);
      expect(errors[0].constraints).toEqual({
        isText: NameMessage.INVALID,
      });
    });

    it('should reject when name is boolean', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: true as unknown as string,
        description: 'Description 1',
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('name');
      expect(errors[0].value).toEqual(data.name);
      expect(errors[0].constraints).toEqual({
        isText: NameMessage.INVALID,
      });
    });

    it('should reject when name is array', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: [] as unknown as string,
        description: 'Description 1',
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('name');
      expect(errors[0].value).toEqual(data.name);
      expect(errors[0].constraints).toEqual({
        isText: NameMessage.INVALID,
      });
    });

    it('should reject when name is object', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: {} as unknown as string,
        description: 'Description 1',
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('name');
      expect(errors[0].value).toEqual(data.name);
      expect(errors[0].constraints).toEqual({
        isText: NameMessage.INVALID,
      });
    });
  });

  describe('description', () => {
    it('should accept when description has max allowed length', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'x'.repeat(ProductImageConfigs.DESCRIPTION_MAX_LENGTH),
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when description is empty', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: '',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when description is null', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: null,
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when description is undefined', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: undefined,
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when description is number', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 1 as unknown as string,
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('description');
      expect(errors[0].value).toEqual(data.description);
      expect(errors[0].constraints).toEqual({
        isText: DescriptionMessage.INVALID,
      });
    });

    it('should reject when description is boolean', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: 'Name 1',
        description: true as unknown as string,
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('description');
      expect(errors[0].value).toEqual(data.description);
      expect(errors[0].constraints).toEqual({
        isText: DescriptionMessage.INVALID,
      });
    });

    it('should reject when description is array', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: 'Name 1',
        description: [] as unknown as string,
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('description');
      expect(errors[0].value).toEqual(data.description);
      expect(errors[0].constraints).toEqual({
        isText: DescriptionMessage.INVALID,
      });
    });

    it('should reject when description is object', async () => {
      const imageId = uuidv4();
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: {} as unknown as string,
        main: true,
        active: true,
        delete: true,
        imageId,
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);

      expect(errors[0].property).toEqual('description');
      expect(errors[0].value).toEqual(data.description);
      expect(errors[0].constraints).toEqual({
        isText: DescriptionMessage.INVALID,
      });
    });
  });

  describe('main', () => {
    it('should accept when main is true', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when main is false', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: false,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when main is undefined', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: undefined,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when main is null', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: null,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('main');
      expect(errors[0].value).toEqual(data.main);
      expect(errors[0].constraints).toEqual({ isBool: MainMessage.NULL });
    });

    it('should reject when main is number', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: 1 as unknown as boolean,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('main');
      expect(errors[0].value).toEqual(data.main);
      expect(errors[0].constraints).toEqual({ isBool: MainMessage.INVALID });
    });

    it('should reject when main is string', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: 'true' as unknown as boolean,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('main');
      expect(errors[0].value).toEqual(data.main);
      expect(errors[0].constraints).toEqual({ isBool: MainMessage.INVALID });
    });

    it('should reject when main is array', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: [] as unknown as boolean,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('main');
      expect(errors[0].value).toEqual(data.main);
      expect(errors[0].constraints).toEqual({ isBool: MainMessage.INVALID });
    });

    it('should reject when main is object', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: {} as unknown as boolean,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('main');
      expect(errors[0].value).toEqual(data.main);
      expect(errors[0].constraints).toEqual({ isBool: MainMessage.INVALID });
    });
  });

  describe('active', () => {
    it('should accept when active is true', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when active is false', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: false,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when active is undefined', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: undefined,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when active is null', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: null,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('active');
      expect(errors[0].value).toEqual(data.active);
      expect(errors[0].constraints).toEqual({ isBool: ActiveMessage.NULL });
    });

    it('should reject when active is number', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: 1 as unknown as boolean,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('active');
      expect(errors[0].value).toEqual(data.active);
      expect(errors[0].constraints).toEqual({ isBool: ActiveMessage.INVALID });
    });

    it('should reject when active is string', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: 'true' as unknown as boolean,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('active');
      expect(errors[0].value).toEqual(data.active);
      expect(errors[0].constraints).toEqual({ isBool: ActiveMessage.INVALID });
    });

    it('should reject when active is array', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: [] as unknown as boolean,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('active');
      expect(errors[0].value).toEqual(data.active);
      expect(errors[0].constraints).toEqual({ isBool: ActiveMessage.INVALID });
    });

    it('should reject when active is object', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: {} as unknown as boolean,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('active');
      expect(errors[0].value).toEqual(data.active);
      expect(errors[0].constraints).toEqual({ isBool: ActiveMessage.INVALID });
    });
  });

  describe('delete', () => {
    it('should accept when delete is true', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: true,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when delete is false', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: false,
        active: true,
        delete: false,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when delete is undefined', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: undefined,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when delete is null', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: null,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('delete');
      expect(errors[0].value).toEqual(data.delete);
      expect(errors[0].constraints).toEqual({ isBool: DeleteMessage.NULL });
    });

    it('should reject when delete is number', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: 1 as unknown as boolean,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('delete');
      expect(errors[0].value).toEqual(data.delete);
      expect(errors[0].constraints).toEqual({ isBool: DeleteMessage.INVALID });
    });

    it('should reject when delete is string', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: 'true' as unknown as boolean,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('delete');
      expect(errors[0].value).toEqual(data.delete);
      expect(errors[0].constraints).toEqual({ isBool: DeleteMessage.INVALID });
    });

    it('should reject when delete is array', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: [] as unknown as boolean,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('delete');
      expect(errors[0].value).toEqual(data.delete);
      expect(errors[0].constraints).toEqual({ isBool: DeleteMessage.INVALID });
    });

    it('should reject when delete is object', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: {} as unknown as boolean,
        imageId: uuidv4(),
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('delete');
      expect(errors[0].value).toEqual(data.delete);
      expect(errors[0].constraints).toEqual({ isBool: DeleteMessage.INVALID });
    });
  });

  describe('imageId', () => {
    it('should accept when imageId is valid', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: true,
        imageId: uuidv4(),
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when imageId is number', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: 1 as unknown as string,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('imageId');
      expect(errors[0].value).toEqual(data.imageId);
      expect(errors[0].constraints).toEqual({ isUuid: ImageIdMessage.STRING });
    });

    it('should reject when imageId is boolean', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: true as unknown as string,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('imageId');
      expect(errors[0].value).toEqual(data.imageId);
      expect(errors[0].constraints).toEqual({ isUuid: ImageIdMessage.STRING });
    });

    it('should reject when imageId is invalid string', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: 'not-a-vallid-uuid',
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('imageId');
      expect(errors[0].value).toEqual(data.imageId);
      expect(errors[0].constraints).toEqual({ isUuid: ImageIdMessage.INVALID });
    });

    it('should reject when imageId is array', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: [] as unknown as string,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('imageId');
      expect(errors[0].value).toEqual(data.imageId);
      expect(errors[0].constraints).toEqual({ isUuid: ImageIdMessage.STRING });
    });

    it('should reject when imageId is object', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: {} as unknown as string,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('imageId');
      expect(errors[0].value).toEqual(data.imageId);
      expect(errors[0].constraints).toEqual({ isUuid: ImageIdMessage.STRING });
    });
  });

  describe('fileIdx', () => {
    it('should accept when file is valid', async () => {
      const fileIdx = 0;
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: true,
        imageId: null,
        fileIdx,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when file is negative', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: null,
        fileIdx: -1,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('fileIdx');
      expect(errors[0].value).toEqual(data.fileIdx);
      expect(errors[0].constraints).toEqual({
        isNum: FileIdxMessage.MIN,
      });
    });

    it('should reject when file is float', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: null,
        fileIdx: 1.1,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('fileIdx');
      expect(errors[0].value).toEqual(data.fileIdx);
      expect(errors[0].constraints).toEqual({
        isNum: FileIdxMessage.INT,
      });
    });

    it('should reject when file is boolean', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: null,
        fileIdx: true as unknown as number,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('fileIdx');
      expect(errors[0].value).toEqual(data.fileIdx);
      expect(errors[0].constraints).toEqual({
        isNum: FileIdxMessage.INVALID,
      });
    });

    it('should reject when file is string', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: null,
        fileIdx: 'invalid' as unknown as number,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('fileIdx');
      expect(errors[0].value).toEqual(data.fileIdx);
      expect(errors[0].constraints).toEqual({
        isNum: FileIdxMessage.INVALID,
      });
    });

    it('should reject when file is array', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: null,
        fileIdx: [] as unknown as number,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('fileIdx');
      expect(errors[0].value).toEqual(data.fileIdx);
      expect(errors[0].constraints).toEqual({
        isNum: FileIdxMessage.INVALID,
      });
    });

    it('should reject when file is object', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: null,
        fileIdx: {} as unknown as number,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('fileIdx');
      expect(errors[0].value).toEqual(data.fileIdx);
      expect(errors[0].constraints).toEqual({
        isNum: FileIdxMessage.INVALID,
      });
    });
  });

  describe('imageId and file', () => {
    it('should accept when imageId is defined and file is null', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: true,
        imageId: uuidv4(),
        fileIdx: null,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when imageId is defined and file is undefined', async () => {
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: true,
        imageId: uuidv4(),
        fileIdx: undefined,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when imageId is null null and file is defined', async () => {
      const fileIdx = 0;
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: true,
        imageId: null,
        fileIdx,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should accept when imageId is undefined and file is defined', async () => {
      const fileIdx = 0;
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: true,
        imageId: undefined,
        fileIdx,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveMetadataItemDto, data);
      expect(dto).toEqual(data);
    });

    it('should reject when both imageId and file are defined', async () => {
      const fileIdx = 0;
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId: uuidv4(),
        fileIdx,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(2);

      expect(errors[0].property).toEqual('imageId');
      expect(errors[0].value).toEqual(data.imageId);
      expect(errors[0].constraints).toEqual({
        isMutuallyExclusive:
          MutuallyExclusiveFieldsMessageFromImageId.BOTH_DEFINED,
      });

      expect(errors[1].property).toEqual('fileIdx');
      expect(errors[1].value).toEqual(data.fileIdx);
      expect(errors[1].constraints).toEqual({
        isMutuallyExclusive:
          MutuallyExclusiveFieldsMessageFromFileIdx.BOTH_DEFINED,
      });
    });

    it('should reject when both imageId and file are undefined', async () => {
      const fileIdx = undefined;
      const imageId = undefined;
      const data: SaveMetadataItemDto = {
        name: 'Image 1',
        description: 'description',
        main: true,
        active: true,
        delete: false,
        imageId,
        fileIdx,
      };
      const errors = await validateFirstError(data, SaveMetadataItemDto);
      expect(errors).toHaveLength(2);

      expect(errors[0].property).toEqual('imageId');
      expect(errors[0].value).toEqual(data.imageId);
      expect(errors[0].constraints).toEqual({
        isMutuallyExclusive:
          MutuallyExclusiveFieldsMessageFromImageId.NONE_DEFINED,
      });

      expect(errors[1].property).toEqual('fileIdx');
      expect(errors[1].value).toEqual(data.fileIdx);
      expect(errors[1].constraints).toEqual({
        isMutuallyExclusive:
          MutuallyExclusiveFieldsMessageFromFileIdx.NONE_DEFINED,
      });
    });
  });
});
