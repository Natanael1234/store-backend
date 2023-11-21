import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { ImagesMetadataMessage } from '../../../../system/decorators/images-metadata/messages/images-metadata/images-metadata.messages.enum';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { ProductImageConfigs } from '../../configs/product-image/product-image.configs';
import { SaveFileAdditionalDataRequestDTO } from './save-file-additional-data.request.dto';

const {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
} = ProductImageConfigs;

describe('SaveFileAdditionalDataRequestDTO', () => {
  describe('metadatas', () => {
    it('should accept when metadatas is an valid array of metadata', async () => {
      const imageId1 = uuidv4();
      const imageId2 = uuidv4();
      const data = {
        metadatas: [
          {
            name: 'Image name',
            description: 'Image description',
            active: true,
            imageId: imageId1,
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
            imageId: imageId2,
          },
          { imageIdx: 1 },
        ],
      };
      const errors = await validateFirstError(
        data,
        SaveFileAdditionalDataRequestDTO,
      );

      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
      expect(dto).toEqual({
        metadatas: [
          {
            name: 'Image name',
            description: 'Image description',
            active: true,
            imageId: imageId1,
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
            imageId: imageId2,
          },
          { imageIdx: 1 },
        ],
      });
    });

    it('should accept when metadatas is an empty array', async () => {
      const data = { metadatas: [] };
      const errors = await validateFirstError(
        data,
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(0);
      const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
      expect(dto).toEqual({ metadatas: [] });
    });

    it('should accept when metadatas is null', async () => {
      const data = { metadatas: null };

      const errors = await validateFirstError(
        data,
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(0);

      const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
      expect(dto).toEqual({ metadatas: null });
    });

    it('should accept when metadatas is undefined', async () => {
      const errors = await validateFirstError(
        { metadatas: undefined },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(0);
    });

    it('should reject when metadatas is string', async () => {
      const str = JSON.stringify([
        {
          name: 'Image 1',
          description: 'Image description 1',
          active: true,
          imageId: 1,
        },
        {
          name: 'Image 2',
          description: 'Image description 2',
          active: false,
          imageIdx: 1,
        },
      ]);
      const errors = await validateFirstError(
        { metadatas: str },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadatas');
      expect(errors[0].value).toEqual(str);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    it('should reject when metadatas is boolean', async () => {
      const errors = await validateFirstError(
        { metadatas: true },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadatas');
      expect(errors[0].value).toEqual(true);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    it('should reject when metadatas is number', async () => {
      const errors = await validateFirstError(
        { metadatas: 1 },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadatas');
      expect(errors[0].value).toEqual(1);
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    it('should reject when metadatas is obect', async () => {
      const errors = await validateFirstError(
        { metadatas: {} },
        SaveFileAdditionalDataRequestDTO,
      );
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('metadatas');
      expect(errors[0].value).toEqual({});
      expect(errors[0].constraints).toEqual({
        isFileMetadata: ImagesMetadataMessage.METADATA_ARRAY_INVALID,
      });
    });

    describe('metadatas item', () => {
      it('should reject null item', async () => {
        const errors = await validateFirstError(
          { metadatas: [null] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadatas');
        expect(errors[0].value).toEqual([null]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
        });
      });

      it('should reject undefined item', async () => {
        const errors = await validateFirstError(
          { metadatas: [undefined] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadatas');
        expect(errors[0].value).toEqual([undefined]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
        });
      });

      it('should reject boolean item', async () => {
        const errors = await validateFirstError(
          { metadatas: [true] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadatas');
        expect(errors[0].value).toEqual([true]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      it('should reject number item', async () => {
        const errors = await validateFirstError(
          { metadatas: [1] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadatas');
        expect(errors[0].value).toEqual([1]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      it('should reject string item', async () => {
        const errors = await validateFirstError(
          { metadatas: [''] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadatas');
        expect(errors[0].value).toEqual(['']);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      it('should reject array item', async () => {
        const errors = await validateFirstError(
          { metadatas: [[]] },
          SaveFileAdditionalDataRequestDTO,
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('metadatas');
        expect(errors[0].value).toEqual([[]]);
        expect(errors[0].constraints).toEqual({
          isFileMetadata: ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
        });
      });

      describe('name', () => {
        const NameTextMessage = new TextMessage('name', {
          maxLength: NAME_MAX_LENGTH,
        });

        it('should accept when name has length 0', async () => {
          const name = 'x'.repeat(0);
          const data = {
            metadatas: [{ name, imageIdx: 1 }],
          };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ name, imageIdx: 1 }] });
        });

        it('should accept when name has maximum allowed length', async () => {
          const name = 'x'.repeat(NAME_MAX_LENGTH);
          const data = { metadatas: [{ name, imageIdx: 1 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ name, imageIdx: 1 }] });
        });

        it('should accept when name is null', async () => {
          const data = { metadatas: [{ name: null, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ name: null, imageIdx: 0 }],
          });
        });

        it('should accept when name is undefined', async () => {
          const data = { metadatas: [{ name: undefined, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ name: undefined, imageIdx: 0 }],
          });
        });

        it('should reject when name is true', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ name: true, imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ name: true, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is false', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ name: false, imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ name: false, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is number', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ name: 1, imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ name: 1, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is object', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ name: {}, imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ name: {}, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is array', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ name: [], imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ name: [], imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.INVALID,
          });
        });

        it('should reject when name is longer than allowed', async () => {
          const name = 'x'.repeat(NAME_MAX_LENGTH + 1);
          const data = { metadatas: [{ name, imageIdx: 1 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ name, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: NameTextMessage.MAX_LEN,
          });
        });
      });

      describe('description', () => {
        const DescriptionTextMessage = new TextMessage('description', {
          maxLength: DESCRIPTION_MAX_LENGTH,
        });

        it('should accept when description has length 0', async () => {
          const description = 'x'.repeat(DESCRIPTION_MAX_LENGTH);
          const data = { metadatas: [{ description, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ description, imageIdx: 0 }] });
        });

        it('should accept when description has maximum allowed length', async () => {
          const description = 'x'.repeat(DESCRIPTION_MAX_LENGTH);
          const data = { metadatas: [{ description, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ description, imageIdx: 0 }] });
        });

        it('should accept when description is null', async () => {
          const data = { metadatas: [{ description: null, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ description: null, imageIdx: 0 }],
          });
        });

        it('should accept when description is undefined', async () => {
          const data = {
            metadatas: [{ description: undefined, imageIdx: 0 }],
          };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ description: undefined, imageIdx: 0 }],
          });
        });

        it('should reject when description is true', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ description: true, imageIdx: 0 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ description: true, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is false', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ description: false, imageIdx: 0 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([
            { description: false, imageIdx: 0 },
          ]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is number', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ description: 1, imageIdx: 0 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ description: 1, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is object', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ description: {}, imageIdx: 0 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ description: {}, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is array', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ description: [], imageIdx: 0 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ description: [], imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.INVALID,
          });
        });

        it('should reject when description is longer than allowed', async () => {
          const description = 'x'.repeat(DESCRIPTION_MAX_LENGTH + 1);
          const data = { metadatas: [{ description, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ description, imageIdx: 0 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: DescriptionTextMessage.MAX_LEN,
          });
        });
      });

      describe('main', () => {
        it('should accept when main is true', async () => {
          const data = { metadatas: [{ main: true, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ main: true, imageIdx: 0 }] });
        });

        it('should accept when main is false', async () => {
          const data = { metadatas: [{ main: false, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ main: false, imageIdx: 0 }] });
        });

        it('should accept when main is undefined', async () => {
          const data = { metadatas: [{ main: undefined, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ main: undefined, imageIdx: 0 }],
          });
        });

        it('should reject when main is string true', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ main: 'true' }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ main: 'true' }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is string false', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ main: 'false' }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ main: 'false' }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is number', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ main: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ main: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is object', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ main: {} }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ main: {} }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is array', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ main: [] }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ main: [] }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_INVALID,
          });
        });

        it('should reject when main is null', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ main: null }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ main: null }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.MAIN_IS_NULL,
          });
        });

        it('should reject when there are multiple mains', async () => {
          const errors = await validateFirstError(
            {
              metadatas: [
                { main: true, imageIdx: 0 },
                { main: undefined, imageIdx: 1 },
                { main: true, imageIdx: 2 },
              ],
            },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
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
          const data = { metadatas: [{ active: true, imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ active: true, imageIdx: 0 }] });
        });

        it('should accept when active is false', async () => {
          const data = { metadatas: [{ active: false, imageIdx: 1 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ active: false, imageIdx: 1 }],
          });
        });

        it('should accept when active is undefined', async () => {
          const data = { metadatas: [{ active: undefined, imageIdx: 1 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ active: undefined, imageIdx: 1 }],
          });
        });

        it('should reject when active is string true', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ active: 'true', imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ active: 'true', imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is string false', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ active: 'false', imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ active: 'false', imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is number', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ active: 1, imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ active: 1, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is object', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ active: {}, imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ active: {}, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is array', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ active: [], imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ active: [], imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_INVALID,
          });
        });

        it('should reject when active is null', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ active: null, imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ active: null, imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.ACTIVE_IS_NULL,
          });
        });
      });

      describe('imageId', () => {
        it('should accept when imageId is valid', async () => {
          const imageId = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
          const data = { metadatas: [{ imageId }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);
          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({ metadatas: [{ imageId }] });
        });

        it('should reject when imageId is number', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageId: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is boolean', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageId: true }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId: true }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is false', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageId: false }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId: false }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is invalid string', async () => {
          const imageId = 'not-a-valid-uuid';
          const errors = await validateFirstError(
            { metadatas: [{ imageId }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is array', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageId: [] }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId: [] }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is object', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageId: {} }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId: {} }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_INVALID,
          });
        });

        it('should reject when imageId is repeated', async () => {
          const imageId = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
          const errors = await validateFirstError(
            { metadatas: [{ imageId }, { imageId }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId }, { imageId }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_ID_DUPLICATED,
          });
        });
      });

      describe('imageIdx', () => {
        it('should accept when imageIdx is int', async () => {
          const data = { metadatas: [{ imageIdx: 0 }] };
          const errors = await validateFirstError(
            data,
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(0);

          const dto = plainToInstance(SaveFileAdditionalDataRequestDTO, data);
          expect(dto).toEqual({
            metadatas: [{ imageIdx: 0 }],
          });
        });

        it('should reject when imageIdx is float', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: 1.1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: 1.1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is smaller than 0', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: -1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: -1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is true', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: true }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: true }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is false', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: false }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: false }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is string', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: '1' }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: '1' }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is array', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: [] }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: [] }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is object', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: {} }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: {} }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_INVALID,
          });
        });

        it('should reject when imageIdx is repeated', async () => {
          const errors = await validateFirstError(
            { metadatas: [{ imageIdx: 1 }, { imageIdx: 1 }] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageIdx: 1 }, { imageIdx: 1 }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata: ImagesMetadataMessage.IMAGE_IDX_DUPLICATED,
          });
        });
      });

      describe('imageId and imageIdx', () => {
        it('should reject when both imageId and imageIdx are defined', async () => {
          const imageId = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
          const imageIdx = 0;
          const errors = await validateFirstError(
            {
              metadatas: [{ imageId, imageIdx }],
            },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
          expect(errors[0].value).toEqual([{ imageId, imageIdx }]);
          expect(errors[0].constraints).toEqual({
            isFileMetadata:
              ImagesMetadataMessage.IMAGE_ID_AND_IMAGE_IDX_DEFINED,
          });
        });

        it('should reject when both imageId and imageIdx are not defined', async () => {
          const errors = await validateFirstError(
            { metadatas: [{}] },
            SaveFileAdditionalDataRequestDTO,
          );
          expect(errors).toHaveLength(1);
          expect(errors[0].property).toEqual('metadatas');
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
