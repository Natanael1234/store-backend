import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { ProductImageConfigs } from '../../../stock/product-image/configs/product-image/product-image.configs';
import { TextMessage } from '../../messages/text/text.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { ImagesMetadata } from './images-metadata.decorator';
import { ImagesMetadataMessage } from './messages/images-metadata/images-metadata.messages.enum';
import { SaveFileMetadataDto } from './save-file-metadata.dto';

class Clazz {
  @ImagesMetadata() someProperty: SaveFileMetadataDto;
}

describe('SaveFileMetadataDto decorator', () => {
  it('should be defined', () => {
    expect(ImagesMetadata).toBeDefined();
  });

  it(`should accept when property is a valid array of metadata`, async () => {
    const someProperty = [
      {
        name: 'Image name',
        description: 'Image description',
        active: true,
        imageId: uuidv4(),
      },
      {
        main: true,
        active: false,
        imageIdx: 2,
      },
      {
        imageIdx: 0,
      },
      {
        delete: true,
        active: undefined,
        imageId: uuidv4(),
      },
      { imageIdx: 1 },
    ];
    const dtoData = { someProperty };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, dtoData);
    expect(dto).toEqual({ someProperty });
  });

  it(`should accept when property is an empty array`, async () => {
    const someProperty = [];
    const dtoData = { someProperty };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, dtoData);
    expect(dto).toEqual({ someProperty });
  });

  it(`should accept when property is null`, async () => {
    const dtoData = { someProperty: null };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, dtoData);
    expect(dto).toEqual({ someProperty: null });
  });

  it(`should accept when property is undefined`, async () => {
    const dtoData = { someProperty: undefined };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(0);
    const dto = plainToInstance(Clazz, dtoData);
    expect(dto).toEqual({ someProperty: undefined });
  });

  it('should reject when when property is string', async () => {
    const str = JSON.stringify([
      {
        name: 'Test name',
        description: 'Test description',
        active: true,
        imageId: uuidv4(),
      },
    ]);
    const dtoData = {
      someProperty: str,
    };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(str);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
    });
  });

  it('should reject when when property is boolean', async () => {
    const dtoData = { someProperty: true };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(true);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
    });
  });

  it('should reject when when property is number', async () => {
    const dtoData = { someProperty: 1 };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(1);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
    });
  });

  it('should reject when when property is object', async () => {
    const dtoData = { someProperty: {} };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual({});
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
    });
  });

  describe('items', () => {
    it('should reject null item', async () => {
      const errors = await validateFirstError({ someProperty: [null] }, Clazz);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('someProperty');
      expect(errors[0].value).toEqual([null]);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
      });
    });

    it('should reject undefined item', async () => {
      const errors = await validateFirstError(
        { someProperty: [undefined] },
        Clazz,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('someProperty');
      expect(errors[0].value).toEqual([undefined]);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
      });
    });

    it('should reject boolean item', async () => {
      const errors = await validateFirstError({ someProperty: [true] }, Clazz);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('someProperty');
      expect(errors[0].value).toEqual([true]);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
      });
    });

    it('should reject number item', async () => {
      const errors = await validateFirstError({ someProperty: [1] }, Clazz);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('someProperty');
      expect(errors[0].value).toEqual([1]);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
      });
    });

    it('should reject string item', async () => {
      const errors = await validateFirstError({ someProperty: [''] }, Clazz);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('someProperty');
      expect(errors[0].value).toEqual(['']);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
      });
    });

    it('should reject array item', async () => {
      const errors = await validateFirstError({ someProperty: [[]] }, Clazz);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('someProperty');
      expect(errors[0].value).toEqual([[]]);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
      });
    });

    describe('fields', () => {
      describe('name', () => {
        const NameTextMessage = new TextMessage('name', {
          maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
        });

        it('should accept when name has length 0', async () => {
          const name = 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH);
          const data = {
            someProperty: [{ name, imageIdx: 1 }],
          };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ name, imageIdx: 1 }] });
        });

        it('should accept when name has maximum allowed length', async () => {
          const name = 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH);
          const data = { someProperty: [{ name, imageIdx: 1 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ name, imageIdx: 1 }] });
        });

        it('should accept when name is null', async () => {
          const data = { someProperty: [{ name: null, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ name: null, imageIdx: 0 }],
          });
        });

        it('should accept when name is undefined', async () => {
          const data = { someProperty: [{ name: undefined, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ name: undefined, imageIdx: 0 }],
          });
        });

        it('should reject when name is true', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ name: true, imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ name: true, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is false', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ name: false, imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ name: false, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is number', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ name: 1, imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ name: 1, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is object', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ name: {}, imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ name: {}, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is array', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ name: [], imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ name: [], imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is longer than allowed', async () => {
          const name = 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH + 1);
          const data = { someProperty: [{ name, imageIdx: 1 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ name, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.MAX_LEN,
          });
        });
      });

      describe('description', () => {
        const DescriptionTextMessage = new TextMessage('description', {
          maxLength: ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
        });

        it('should accept when description has length 0', async () => {
          const description = 'x'.repeat(
            ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
          );
          const data = { someProperty: [{ description, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ description, imageIdx: 0 }] });
        });

        it('should accept when description has maximum allowed length', async () => {
          const description = 'x'.repeat(
            ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
          );
          const data = { someProperty: [{ description, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ description, imageIdx: 0 }] });
        });

        it('should accept when description is null', async () => {
          const data = { someProperty: [{ description: null, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ description: null, imageIdx: 0 }],
          });
        });

        it('should accept when description is undefined', async () => {
          const data = {
            someProperty: [{ description: undefined, imageIdx: 0 }],
          };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ description: undefined, imageIdx: 0 }],
          });
        });

        it('should reject when description is true', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ description: true, imageIdx: 0 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ description: true, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is false', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ description: false, imageIdx: 0 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([
            { description: false, imageIdx: 0 },
          ]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is number', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ description: 1, imageIdx: 0 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ description: 1, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is object', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ description: {}, imageIdx: 0 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ description: {}, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is array', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ description: [], imageIdx: 0 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ description: [], imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is longer than allowed', async () => {
          const description = 'x'.repeat(
            ProductImageConfigs.NAME_MAX_LENGTH + 1,
          );
          const data = { someProperty: [{ description, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ description, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.MAX_LEN,
          });
        });
      });

      describe('main', () => {
        it('should accept when main is true', async () => {
          const data = { someProperty: [{ main: true, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ main: true, imageIdx: 0 }] });
        });

        it('should accept when main is false', async () => {
          const data = { someProperty: [{ main: false, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ main: false, imageIdx: 0 }] });
        });

        it('should accept when main is undefined', async () => {
          const data = { someProperty: [{ main: undefined, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ main: undefined, imageIdx: 0 }],
          });
        });

        it('should reject when main is string true', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ main: 'true' }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ main: 'true' }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is string false', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ main: 'false' }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ main: 'false' }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is number', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ main: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ main: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is object', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ main: {} }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ main: {} }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is array', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ main: [] }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ main: [] }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is null', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ main: null }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ main: null }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_NULL,
          });
        });

        it('should reject when there are multiple mains', async () => {
          const errors = await validateFirstError(
            {
              someProperty: [
                { main: true, imageIdx: 0 },
                { main: undefined, imageIdx: 1 },
                { main: true, imageIdx: 2 },
              ],
            },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([
            { main: true, imageIdx: 0 },
            { main: undefined, imageIdx: 1 },
            { main: true, imageIdx: 2 },
          ]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MULTIPLE_MAINS,
          });
        });
      });

      describe('active', () => {
        it('should accept when active is true', async () => {
          const data = { someProperty: [{ active: true, imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ active: true, imageIdx: 0 }],
          });
        });

        it('should accept when active is false', async () => {
          const data = { someProperty: [{ active: false, imageIdx: 1 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ active: false, imageIdx: 1 }],
          });
        });

        it('should accept when active is undefined', async () => {
          const data = { someProperty: [{ active: undefined, imageIdx: 1 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ active: undefined, imageIdx: 1 }],
          });
        });

        it('should reject when active is string true', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ active: 'true', imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ active: 'true', imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is string false', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ active: 'false', imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ active: 'false', imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is number', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ active: 1, imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ active: 1, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is object', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ active: {}, imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ active: {}, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is array', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ active: [], imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ active: [], imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is null', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ active: null, imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ active: null, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_NULL,
          });
        });
      });

      describe('imageId', () => {
        it('should accept when imageId is valid', async () => {
          const imageId = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
          const data = { someProperty: [{ imageId }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ imageId }],
          });
        });

        it('should reject when imageId is number', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageId: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageId: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is boolean', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageId: true }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageId: true }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is invalid string', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageId: 'not-a-valid-uuid' }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageId: 'not-a-valid-uuid' }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is array', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageId: [] }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageId: [] }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is object', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageId: {} }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageId: {} }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is repeated', async () => {
          const imageId = uuidv4();
          const errors = await validateFirstError(
            { someProperty: [{ imageId }, { imageId }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageId }, { imageId }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_DUPLICATED,
          });
        });
      });

      describe('imageIdx', () => {
        it('should accept when imageIdx is int', async () => {
          const data = { someProperty: [{ imageIdx: 0 }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ imageIdx: 0 }],
          });
        });

        it('should reject when imageIdx is float', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: 1.1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: 1.1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is smaller than 0', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: -1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: -1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is true', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: true }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: true }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is false', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: false }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: false }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is string', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: '1' }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: '1' }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is array', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: [] }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: [] }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is object', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: {} }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: {} }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is repeated', async () => {
          const errors = await validateFirstError(
            { someProperty: [{ imageIdx: 1 }, { imageIdx: 1 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageIdx: 1 }, { imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_DUPLICATED,
          });
        });
      });

      describe('imageId and imageIdx', () => {
        it('should reject when both imageId and imageIdx are defined', async () => {
          const imageId = uuidv4();
          const errors = await validateFirstError(
            { someProperty: [{ imageId, imageIdx: 0 }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ imageId, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata:
              ImagesMetadataMessage.IMAGE_ID_AND_IMAGE_IDX_DEFINED,
          });
        });

        it('should reject when both imageId and imageIdx are not defined', async () => {
          const errors = await validateFirstError(
            { someProperty: [{}] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{}]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata:
              ImagesMetadataMessage.IMAGE_ID_AND_IMAGE_IDX_NOT_DEFINED,
          });
        });
      });
    });
  });
});
