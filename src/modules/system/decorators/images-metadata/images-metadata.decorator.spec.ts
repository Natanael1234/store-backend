import { Type, plainToInstance } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { ProductImageConfigs } from '../../../stock/product-image/configs/product-image/product-image.configs';
import { SaveMetadataItemDto } from '../../dtos/save-metadata-item/save-metadata-item.dto';
import { BoolMessage } from '../../messages/bool/bool.messages';
import { ImagesMetadataMessage } from '../../messages/images-metadata/images-metadata.messages.enum';
import { MutuallyExclusiveFieldsMessage } from '../../messages/mutually-exclusive-fields/mutually-exclusive-fields.messages';
import { NumberMessage } from '../../messages/number/number.messages';
import { TextMessage } from '../../messages/text/text.messages';
import { UuidMessage } from '../../messages/uuid/uuid.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { ImagesMetadata } from './images-metadata.decorator';

class Clazz {
  @ValidateNested()
  @Type(() => SaveMetadataItemDto)
  @ImagesMetadata()
  someProperty: SaveMetadataItemDto;
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
      { main: true, active: false, fileIdx: 2 },
      { fileIdx: 0 },
      { delete: true, active: undefined, imageId: uuidv4() },
      { fileIdx: 1 },
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

  it(`should reject when property is null`, async () => {
    const dtoData = { someProperty: null };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(dtoData.someProperty);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_NOT_DEFINED,
    });
  });

  it(`should reject when property is undefined`, async () => {
    const dtoData = { someProperty: undefined };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(dtoData.someProperty);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_NOT_DEFINED,
    });
  });

  it('should reject when property is string', async () => {
    const str = JSON.stringify([
      {
        name: 'Test name',
        description: 'Test description',
        active: true,
        imageId: uuidv4(),
      },
    ]);
    const dtoData = { someProperty: str };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(str);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
    });
  });

  it('should reject when property is boolean', async () => {
    const dtoData = { someProperty: true };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(true);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
    });
  });

  it('should reject when property is number', async () => {
    const dtoData = { someProperty: 1 };
    const errors = await validateFirstError(dtoData, Clazz);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('someProperty');
    expect(errors[0].value).toEqual(1);
    expect(errors[0].constraints).toEqual({
      isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
    });
  });

  it('should reject when property is object', async () => {
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
          const fileIdx = 1;
          const data = { someProperty: [{ name, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ name, fileIdx }] });
        });

        it('should accept when name has maximum allowed length', async () => {
          const name = 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH);
          const fileIdx = 1;
          const data = { someProperty: [{ name, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ name, fileIdx }] });
        });

        it('should accept when name is null', async () => {
          const name = null;
          const fileIdx = 0;
          const data = { someProperty: [{ name, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ name, fileIdx }],
          });
        });

        it('should accept when name is undefined', async () => {
          const name = null;
          const fileIdx = 0;
          const data = { someProperty: [{ name, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ name, fileIdx }],
          });
        });

        it('should reject when name is boolean', async () => {
          const name = true;
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ name, fileIdx }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ name, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is number', async () => {
          const name = 1;
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ name, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ name, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is array', async () => {
          const name = [];
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ name, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ name, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is object', async () => {
          const name = {};
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ name, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ name, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is longer than allowed', async () => {
          const name = 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH + 1);
          const fileIdx = 1;
          const data = { someProperty: [{ name, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ name, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.MAX_LEN,
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
          const fileIdx = 0;
          const data = { someProperty: [{ description, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ description, fileIdx }],
          });
        });

        it('should accept when description has maximum allowed length', async () => {
          const description = 'x'.repeat(
            ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
          );
          const fileIdx = 0;
          const data = { someProperty: [{ description, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ description, fileIdx }],
          });
        });

        it('should accept when description is null', async () => {
          const description = null;
          const fileIdx = 0;
          const data = {
            someProperty: [{ description, fileIdx }],
          };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ description, fileIdx }],
          });
        });

        it('should accept when description is undefined', async () => {
          const description = undefined;
          const fileIdx = 0;
          const data = {
            someProperty: [{ description, fileIdx }],
          };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ description, fileIdx }],
          });
        });

        it('should reject when description is boolean', async () => {
          const description = true;
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ description, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ description, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is number', async () => {
          const description = 1;
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ description, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ description, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is object', async () => {
          const description = {};
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ description, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ description, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is array', async () => {
          const description = [];
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ description, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ description, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is longer than allowed', async () => {
          const description = 'x'.repeat(
            ProductImageConfigs.NAME_MAX_LENGTH + 1,
          );
          const fileIdx = 0;
          const data = { someProperty: [{ description, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ description, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.MAX_LEN,
          });
        });
      });

      describe('main', () => {
        const MainMessage = new BoolMessage('main');

        it('should accept when main is boolean', async () => {
          const main = true;
          const fileIdx = 0;
          const data = { someProperty: [{ main, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ main, fileIdx }] });
        });

        it('should accept when main is undefined', async () => {
          const main = undefined;
          const fileIdx = 0;
          const data = { someProperty: [{ main, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ main, fileIdx }] });
        });

        it('should reject when main is string boolean', async () => {
          const main = 'true';
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ main, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ main, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(main);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: MainMessage.INVALID,
          });
        });

        it('should reject when main is number', async () => {
          const main = 1;
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ main, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ main, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(main);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: MainMessage.INVALID,
          });
        });

        it('should reject when main is object', async () => {
          const main = {};
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ main, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ main, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(main);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: MainMessage.INVALID,
          });
        });

        it('should reject when main is array', async () => {
          const main = [];
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ main, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ main, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(main);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: MainMessage.INVALID,
          });
        });

        it('should reject when main is null', async () => {
          const main = null;
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ main, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ main, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(main);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: MainMessage.NULL,
          });
        });

        it('should reject when there are multiple mains', async () => {
          const errors = await validateFirstError(
            {
              someProperty: [
                { main: true, fileIdx: 0 },
                { main: undefined, fileIdx: 1 },
                { main: true, fileIdx: 2 },
              ],
            },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([
            { main: true, fileIdx: 0 },
            { main: undefined, fileIdx: 1 },
            { main: true, fileIdx: 2 },
          ]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MULTIPLE_MAINS,
          });
        });
      });

      describe('active', () => {
        const ActiveMessage = new BoolMessage('active');

        it('should accept when active is boolean', async () => {
          const active = true;
          const fileIdx = 0;
          const data = { someProperty: [{ active, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({ someProperty: [{ active, fileIdx }] });
        });

        it('should accept when active is undefined', async () => {
          const active = undefined;
          const fileIdx = 1;
          const data = { someProperty: [{ active, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ active, fileIdx }],
          });
        });

        it('should reject when active is string boolean', async () => {
          const active = 'true';
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ active, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ active, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is number', async () => {
          const active = 1;
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ active, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ active, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is object', async () => {
          const active = {};
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ active, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ active, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is array', async () => {
          const active = [];
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ active, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ active, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is null', async () => {
          const active = null;
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ active, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ active, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.NULL,
          });
        });
      });

      describe('delete', () => {
        const DeleteMessage = new BoolMessage('delete');

        it('should accept when delete is boolean', async () => {
          const deleteValue = true;
          const fileIdx = 0;
          const data = { someProperty: [{ delete: deleteValue, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ delete: deleteValue, fileIdx }],
          });
        });

        it('should accept when delete is undefined', async () => {
          const deleteValue = undefined;
          const fileIdx = 1;
          const data = { someProperty: [{ delete: deleteValue, fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ delete: deleteValue, fileIdx }],
          });
        });

        it('should reject when delete is string boolean', async () => {
          const deleteValue = 'true';
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ delete: deleteValue, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ delete: deleteValue, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(deleteValue);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: DeleteMessage.INVALID,
          });
        });

        it('should reject when delete is number', async () => {
          const deleteValue = 1;
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ delete: deleteValue, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ delete: deleteValue, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(deleteValue);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: DeleteMessage.INVALID,
          });
        });

        it('should reject when delete is object', async () => {
          const deleteValue = {};
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ delete: deleteValue, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ delete: deleteValue, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(deleteValue);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: DeleteMessage.INVALID,
          });
        });

        it('should reject when delete is array', async () => {
          const deleteValue = [];
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ delete: deleteValue, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ delete: deleteValue, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(deleteValue);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: DeleteMessage.INVALID,
          });
        });

        it('should reject when delete is null', async () => {
          const deleteValue = null;
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ delete: deleteValue, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ delete: deleteValue, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(deleteValue);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: DeleteMessage.NULL,
          });
        });
      });

      describe('imageId', () => {
        const ImageIdMessage = new UuidMessage('image id');

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
          const imageId = 1;
          const errors = await validateFirstError(
            { someProperty: [{ imageId }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ imageId }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(imageId);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isUuid: ImageIdMessage.STRING,
          });
        });

        it('should reject when imageId is boolean', async () => {
          const imageId = true;
          const errors = await validateFirstError(
            { someProperty: [{ imageId }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ imageId }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(imageId);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isUuid: ImageIdMessage.STRING,
          });
        });

        it('should reject when imageId is invalid string', async () => {
          const imageId = 'not-a-valid-uuid';
          const errors = await validateFirstError(
            { someProperty: [{ imageId }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ imageId }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(imageId);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isUuid: ImageIdMessage.INVALID,
          });
        });

        it('should reject when imageId is array', async () => {
          const imageId = [];
          const errors = await validateFirstError(
            { someProperty: [{ imageId }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ imageId }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(imageId);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isUuid: ImageIdMessage.STRING,
          });
        });

        it('should reject when imageId is object', async () => {
          const imageId = {};
          const errors = await validateFirstError(
            { someProperty: [{ imageId }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ imageId }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(imageId);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isUuid: ImageIdMessage.STRING,
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

      describe('fileIdx', () => {
        const FileIdxMessage = new NumberMessage('file index', { min: 0 });
        it('should accept when fileIdx is int', async () => {
          const fileIdx = 0;
          const data = { someProperty: [{ fileIdx }] };
          const errors = await validateFirstError(data, Clazz);
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(Clazz, data);
          expect(dto).toEqual({
            someProperty: [{ fileIdx }],
          });
        });

        it('should reject when fileIdx is float', async () => {
          const fileIdx = 1.1;
          const errors = await validateFirstError(
            { someProperty: [{ fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isNum: FileIdxMessage.INT,
          });
        });

        it('should reject when fileIdx is smaller than 0', async () => {
          const fileIdx = -1;
          const errors = await validateFirstError(
            { someProperty: [{ fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isNum: FileIdxMessage.MIN,
          });
        });

        it('should reject when fileIdx is boolean', async () => {
          const fileIdx = true;
          const errors = await validateFirstError(
            { someProperty: [{ fileIdx }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isNum: FileIdxMessage.INVALID,
          });
        });

        it('should reject when fileIdx is string', async () => {
          const fileIdx = '1';
          const errors = await validateFirstError(
            { someProperty: [{ fileIdx }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isNum: FileIdxMessage.INVALID,
          });
        });

        it('should reject when fileIdx is array', async () => {
          const fileIdx = [];
          const errors = await validateFirstError(
            { someProperty: [{ fileIdx }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isNum: FileIdxMessage.INVALID,
          });
        });

        it('should reject when fileIdx is object', async () => {
          const fileIdx = {};
          const errors = await validateFirstError(
            { someProperty: [{ fileIdx }] },
            Clazz,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isNum: FileIdxMessage.INVALID,
          });
        });

        it('should reject when fileIdx is repeated', async () => {
          const fileIdx = 1;
          const errors = await validateFirstError(
            { someProperty: [{ fileIdx }, { fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].value).toEqual([{ fileIdx }, { fileIdx }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.FILE_IDX_DUPLICATED,
          });
        });
      });

      describe('imageId and fileIdx', () => {
        const ImageIdMessage = new MutuallyExclusiveFieldsMessage(
          'imageId',
          'fileIdx',
        );
        const FileIdxMessage = new MutuallyExclusiveFieldsMessage(
          'fileIdx',
          'imageId',
        );

        it('should reject when both imageId and fileIdx are defined', async () => {
          const imageId = uuidv4();
          const fileIdx = 0;
          const errors = await validateFirstError(
            { someProperty: [{ imageId, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ imageId, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(2);

          expect(errors[0].children[0].children[0].value).toEqual(imageId);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isMutuallyExclusive: ImageIdMessage.BOTH_DEFINED,
          });

          expect(errors[0].children[0].children[1].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[1].constraints).toEqual({
            isMutuallyExclusive: FileIdxMessage.BOTH_DEFINED,
          });
        });

        it('should reject when both imageId and fileIdx are not defined', async () => {
          const imageId = undefined;
          const fileIdx = undefined;
          const errors = await validateFirstError(
            { someProperty: [{ imageId, fileIdx }] },
            Clazz,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('someProperty');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{}]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(2);

          expect(errors[0].children[0].children[0].value).toEqual(imageId);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isMutuallyExclusive: ImageIdMessage.NONE_DEFINED,
          });

          expect(errors[0].children[0].children[1].value).toEqual(fileIdx);
          expect(errors[0].children[0].children[1].constraints).toEqual({
            isMutuallyExclusive: FileIdxMessage.NONE_DEFINED,
          });
        });
      });
    });
  });
});
