import { TestCategoryData } from '../../../../../test/category/test-category-data';
import { TestPurpose } from '../../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../../test/test-data/test-active-data';
import {
  getFKAcceptableValues,
  getFKErrorDataList,
} from '../../../../../test/test-data/test-fk-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../../../../../test/test-data/test-name-data';
import { validateFirstError } from '../../../../system/utils/validation';
import { CategoryMessage } from '../../../enums/messages/category-messages/category-messages.enum';
import { CreateCategoryRequestDTO } from './create-category.request.dto';

describe('CreateCategoryRequestDTO', () => {
  it('should pass validation', async () => {
    const categoryData = TestCategoryData.dataForRepository;

    const errors = await validateFirstError(
      categoryData[0],
      CreateCategoryRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it.each(
      getNameErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateCategoryRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getNameAcceptableValues({
        dtoData: TestCategoryData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )('should validate when name is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateCategoryRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('active', () => {
    it.each(
      getActiveErrorDataList({
        dtoData: TestCategoryData.dataForRepository[1],
      }),
    )(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateCategoryRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getActiveAcceptableValues({
        dtoData: TestCategoryData.dataForRepository[1],
      }),
    )('should validate when active is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateCategoryRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('parentId', () => {
    it.each(
      getFKErrorDataList({
        property: 'parentId',
        dtoData: TestCategoryData.dataForRepository[1],
        allowUndefined: true,
        allowNull: true,
        messages: {
          invalid: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          type: CategoryMessage.PARENT_CATEGORY_ID_TYPE,
          undefined: CategoryMessage.REQUIRED_PARENT_CATEGORY_ID,
          null: CategoryMessage.NULL_PARENT_CATEGORY_ID,
        },
      }),
    )(
      'should fail when parentId is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateCategoryRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('parentId');
        expect(errors[0].value).toEqual(data.parentId);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getFKAcceptableValues({
        property: 'parentId',
        dtoData: TestCategoryData.dataForRepository[1],
        allowUndefined: true,
        allowNull: true,
      }),
    )('should validate when parentId is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateCategoryRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });
});
