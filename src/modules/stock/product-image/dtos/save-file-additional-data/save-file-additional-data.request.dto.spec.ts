import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { TestImages } from '../../../../../test/images/test-images';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { ImagesMetadataMessage } from '../../../../system/messages/images-metadata/images-metadata.messages.enum';
import { MutuallyExclusiveFieldsMessage } from '../../../../system/messages/mutually-exclusive-fields/mutually-exclusive-fields.messages';
import { NumberMessage } from '../../../../system/messages/number/number.messages';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { ProductImageConfigs } from '../../configs/product-image/product-image.configs';
import { SaveFileAdditionalDataRequestDTO } from './save-file-additional-data.request.dto';

describe('SaveFileAdditionalDataRequestDTO', () => {
  describe('metadata', () => {
    it('should accept when metadata is an valid array of metadata', async () => {
      const [file1, file2, file3] = await TestImages.buildFiles(3);
      const imageId1 = uuidv4();
      const imageId2 = uuidv4();
      const data = {
        metadata: [
          {
            name: 'Image name',
            description: 'Image description',
            active: true,
            imageId: imageId1,
          },
          { main: true, active: false, fileIdx: 2 },
          { fileIdx: 0 },
          { delete: true, active: undefined, imageId: imageId2 },
          { fileIdx: 1 },
        ],
      };
      const errors = await validateFirstError(
        data,
        SaveFileAdditionalDataRequestDTO,
      );

      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
      expect(dto).toEqual({
        metadata: [
          {
            name: 'Image name',
            description: 'Image description',
            active: true,
            imageId: imageId1,
          },
          { main: true, active: false, fileIdx: 2 },
          { fileIdx: 0 },
          { delete: true, active: undefined, imageId: imageId2 },
          { fileIdx: 1 },
        ],
      });
    });

    it('should reject when metadata is an empty array', async () => {
      const errors = await validateFirstError(
        { metadata: true },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadata');
      expect(errors[0].value).toEqual(true);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    it('should reject when metadata is null', async () => {
      const errors = await validateFirstError(
        { metadata: null },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadata');
      expect(errors[0].value).toEqual(null);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_NOT_DEFINED,
      });
    });

    it('should accept when metadata is undefined', async () => {
      const errors = await validateFirstError(
        { metadata: undefined },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadata');
      expect(errors[0].value).toEqual(undefined);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_NOT_DEFINED,
      });
    });

    it('should reject when metadata is string', async () => {
      const fileIdx = 1;
      const str = JSON.stringify([
        {
          name: 'Image 1',
          description: 'Image description 1',
          active: true,
          fileIdx,
        },
        {
          name: 'Image 2',
          description: 'Image description 2',
          active: false,
          fileIdx,
        },
      ]);
      const errors = await validateFirstError(
        { metadata: str },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadata');
      expect(errors[0].value).toEqual(str);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    it('should reject when metadata is boolean', async () => {
      const errors = await validateFirstError(
        { metadata: true },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadata');
      expect(errors[0].value).toEqual(true);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    it('should reject when metadata is number', async () => {
      const errors = await validateFirstError(
        { metadata: 1 },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadata');
      expect(errors[0].value).toEqual(1);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    it('should reject when metadata is obect', async () => {
      const errors = await validateFirstError(
        { metadata: {} },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadata');
      expect(errors[0].value).toEqual({});
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    describe('metadata item', () => {
      it('should reject null item', async () => {
        const errors = await validateFirstError(
          { metadata: [null] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadata');
        expect(errors[0].value).toEqual([null]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
        });
      });

      it('should reject undefined item', async () => {
        const errors = await validateFirstError(
          { metadata: [undefined] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadata');
        expect(errors[0].value).toEqual([undefined]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
        });
      });

      it('should reject boolean item', async () => {
        const errors = await validateFirstError(
          { metadata: [true] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadata');
        expect(errors[0].value).toEqual([true]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      it('should reject number item', async () => {
        const errors = await validateFirstError(
          { metadata: [1] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadata');
        expect(errors[0].value).toEqual([1]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      it('should reject string item', async () => {
        const errors = await validateFirstError(
          { metadata: [''] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadata');
        expect(errors[0].value).toEqual(['']);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      it('should reject array item', async () => {
        const errors = await validateFirstError(
          { metadata: [[]] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadata');
        expect(errors[0].value).toEqual([[]]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      describe('name', () => {
        const NameTextMessage = new TextMessage('name', {
          maxLength: ProductImageConfigs.NAME_MAX_LENGTH,
        });

        it('should accept when name has length 0', async () => {
          const name = 'x'.repeat(0);
          const fileIdx = 1;
          const data = {
            metadata: [{ name, fileIdx }],
          };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ name, fileIdx }] });
        });

        it('should accept when name has maximum allowed length', async () => {
          const name = 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH);
          const fileIdx = 1;
          const data = { metadata: [{ name, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ name, fileIdx }] });
        });

        it('should accept when name is null', async () => {
          const name = null;
          const fileIdx = 0;
          const data = { metadata: [{ name, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ name, fileIdx }] });
        });

        it('should accept when name is undefined', async () => {
          const name = undefined;
          const fileIdx = 0;
          const data = { metadata: [{ name, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ name, fileIdx }] });
        });

        it('should reject when name is boolean', async () => {
          const name = true;
          const fileIdx = 1;
          const errors = await validateFirstError(
            { metadata: [{ name: true, fileIdx }] },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual([{ name, fileIdx }]);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('name');
          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is number', async () => {
          const name = 1;
          const fileIdx = 1;
          const metadata = [{ name, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('name');
          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is object', async () => {
          const name = {};
          const fileIdx = 1;
          const metadata = [{ name, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('name');
          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is array', async () => {
          const name = [];
          const fileIdx = 1;
          const metadata = [{ name, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('name');
          expect(errors[0].children[0].children[0].value).toEqual(name);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is longer than allowed', async () => {
          const name = 'x'.repeat(ProductImageConfigs.NAME_MAX_LENGTH + 1);
          const fileIdx = 1;
          const metadata = [{ name, fileIdx }];
          const data = { metadata };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('name');
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
          const fileIdx = 0;
          const description = 'x'.repeat(
            ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
          );
          const data = { metadata: [{ description, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ description, fileIdx }] });
        });

        it('should accept when description has maximum allowed length', async () => {
          const fileIdx = 0;
          const description = 'x'.repeat(
            ProductImageConfigs.DESCRIPTION_MAX_LENGTH,
          );
          const data = { metadata: [{ description, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ description, fileIdx }] });
        });

        it('should accept when description is null', async () => {
          const description = null;
          const fileIdx = 0;
          const data = { metadata: [{ description, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ description, fileIdx }] });
        });

        it('should accept when description is undefined', async () => {
          const description = undefined;
          const fileIdx = 0;
          const data = { metadata: [{ description, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadata: [{ description, fileIdx }],
          });
        });

        it('should reject when description is boolean', async () => {
          const description = true;
          const fileIdx = 0;
          const metadata = [{ description, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual(
            'description',
          );
          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is number', async () => {
          const description = 1;
          const fileIdx = 0;
          const metadata = [{ description, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual(
            'description',
          );
          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is object', async () => {
          const description = {};
          const fileIdx = 0;
          const metadata = [{ description, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual(
            'description',
          );
          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is array', async () => {
          const description = [];
          const fileIdx = 0;
          const metadata = [{ description, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual(
            'description',
          );
          expect(errors[0].children[0].children[0].value).toEqual(description);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isText: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is longer than allowed', async () => {
          const description = 'x'.repeat(
            ProductImageConfigs.DESCRIPTION_MAX_LENGTH + 1,
          );
          const fileIdx = 0;
          const metadata = [{ description, fileIdx }];
          const data = { metadata };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual(
            'description',
          );
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
          const data = { metadata: [{ main, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ main, fileIdx }] });
        });

        it('should accept when main is undefined', async () => {
          const main = undefined;
          const fileIdx = 0;
          const data = { metadata: [{ main, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ main, fileIdx }] });
        });

        it('should reject when main is string boolean', async () => {
          const main = 'true';
          const fileIdx = 0;
          const metadata = [{ main, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ main, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ main, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ main, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const fileIdx = 0;
          const main = null;
          const metadata = [{ main, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const [file1, file2, file3] = await TestImages.buildFiles(3);
          const errors = await validateFirstError(
            {
              metadata: [
                { main: true, fileIdx: 0 },
                { main: undefined, fileIdx: 1 },
                { main: true, fileIdx: 2 },
              ],
            },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
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

        it('should accept when active is true', async () => {
          const active = true;
          const fileIdx = 0;
          const data = { metadata: [{ active, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ active, fileIdx }] });
        });

        it('should accept when active is false', async () => {
          const active = false;
          const fileIdx = 1;
          const data = { metadata: [{ active, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadata: [{ active, fileIdx }],
          });
        });

        it('should accept when active is undefined', async () => {
          const active = undefined;
          const fileIdx = 1;
          const data = { metadata: [{ active, fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadata: [{ active, fileIdx }],
          });
        });

        it('should reject when active is string boolean', async () => {
          const active = 'true';
          const fileIdx = 1;
          const metadata = [{ active, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('active');
          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is number', async () => {
          const active = 1;
          const fileIdx = 1;
          const metadata = [{ active, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('active');
          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is object', async () => {
          const active = {};
          const fileIdx = 1;
          const metadata = [{ active, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('active');
          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is array', async () => {
          const active = [];
          const fileIdx = 1;
          const metadata = [{ active: [], fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('active');
          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.INVALID,
          });
        });

        it('should reject when active is null', async () => {
          const active = null;
          const fileIdx = 1;
          const metadata = [{ active, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(1);

          expect(errors[0].children[0].children[0].property).toEqual('active');
          expect(errors[0].children[0].children[0].value).toEqual(active);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isBool: ActiveMessage.NULL,
          });
        });
      });

      describe('imageId', () => {
        const ImageIdMessage = new UuidMessage('image id');

        it('should accept when imageId is valid', async () => {
          const imageId = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
          const data = { metadata: [{ imageId }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ imageId }] });
        });

        it('should reject when imageId is number', async () => {
          const imageId = 1;
          const metadata = [{ imageId }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ imageId }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ imageId }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ imageId }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ imageId }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const imageId = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
          const metadata = [{ imageId }, { imageId }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);
        });
      });

      describe('fileIdx', () => {
        const FileIdxMessage = new NumberMessage('file index', { min: 0 });
        it('should accept when fileIdx is int', async () => {
          const fileIdx = 0;
          const data = { metadata: [{ fileIdx }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadata: [{ fileIdx }] });
        });

        it('should reject when fileIdx is float', async () => {
          const fileIdx = 1.1;
          const metadata = [{ fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{ fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const fileIdx = 0;
          const metadata = [{ fileIdx }, { fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].value).toEqual(metadata);
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
          const imageId = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
          const fileIdx = 0;
          const metadata = [{ imageId, fileIdx }];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

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
          const metadata = [{}];
          const errors = await validateFirstError(
            { metadata },
            SaveFileAdditionalDataRequestDTO,
          );

          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadata');
          expect(errors[0].children).toBeDefined();
          expect(errors[0].value).toEqual(metadata);

          expect(errors[0].children).toBeDefined();
          expect(errors[0].children).toHaveLength(1);
          expect(errors[0].children[0]).toBeDefined();
          expect(errors[0].children[0].property).toEqual('0');

          expect(errors[0].children[0].children).toBeDefined();
          expect(errors[0].children[0].children).toHaveLength(2);

          expect(errors[0].children[0].children[0].value).toEqual(undefined);
          expect(errors[0].children[0].children[0].constraints).toEqual({
            isMutuallyExclusive: ImageIdMessage.NONE_DEFINED,
          });

          expect(errors[0].children[0].children[1].value).toEqual(undefined);
          expect(errors[0].children[0].children[1].constraints).toEqual({
            isMutuallyExclusive: FileIdxMessage.NONE_DEFINED,
          });
        });
      });
    });
  });
});
