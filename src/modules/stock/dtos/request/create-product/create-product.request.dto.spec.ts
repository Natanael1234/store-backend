import { TestProductData } from '../../../../../test/product/test-product-data';
import { TestPurpose } from '../../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../../test/test-data/test-active-data';
import {
  getCodeAcceptableValues,
  getCodeErrorDataList,
} from '../../../../../test/test-data/test-code-data';
import {
  getFKAcceptableValues,
  getFKErrorDataList,
} from '../../../../../test/test-data/test-fk-data';
import {
  getModelAcceptableValues,
  getModelErrorDataList,
} from '../../../../../test/test-data/test-model-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../../../../../test/test-data/test-name-data';
import { getPriceErrorDataList } from '../../../../../test/test-data/test-price-data';
import {
  getQuantityInStockAcceptableValues,
  getQuantityInStockErrorDataList,
} from '../../../../../test/test-data/test-quantity-in-stock-data';
import { validateFirstError } from '../../../../system/utils/validation';
import { BrandMessage } from '../../../enums/messages/brand-messages/brand-messages.enum';
import { CategoryMessage } from '../../../enums/messages/category-messages/category-messages.enum';
import { CreateProductRequestDTO } from './create-product.request.dto';

describe('CreateProductRequestDTO', () => {
  it('should pass validation', async () => {
    const errors = await validateFirstError(
      TestProductData.dataForRepository[1],
      CreateProductRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('code', () => {
    it.each(
      getCodeErrorDataList({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail validation when code is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('code');
        expect(errors[0].value).toEqual(data.code);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getCodeAcceptableValues({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )('should validate when code is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('name', () => {
    it.each(
      getNameErrorDataList({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getNameAcceptableValues({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )('should validate when name is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('model', () => {
    it.each(
      getModelErrorDataList({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail validation when model is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('model');
        expect(errors[0].value).toEqual(data.model);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getModelAcceptableValues({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )('should validate when model is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('price', () => {
    it.each(
      getPriceErrorDataList({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail when price is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('price');
        expect(errors[0].value).toEqual(data.price);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getModelAcceptableValues({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )('should validate when price is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('quantityInStock', () => {
    it.each(
      getQuantityInStockErrorDataList({
        dtoData: TestProductData.dataForRepository[1],
      }),
    )(
      'should fail when quantity in stock is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('quantityInStock');
        expect(errors[0].value).toEqual(data.quantityInStock);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getQuantityInStockAcceptableValues({
        dtoData: TestProductData.dataForRepository[1],
        purpose: TestPurpose.create,
      }),
    )(
      'should validate when quantity in stock is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('active', () => {
    it.each(
      getActiveErrorDataList({ dtoData: TestProductData.dataForRepository[1] }),
    )(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getActiveAcceptableValues({
        dtoData: TestProductData.dataForRepository[1],
      }),
    )('should validate when active is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('brandId', () => {
    it.each(
      getFKErrorDataList({
        property: 'brandId',
        dtoData: TestProductData.dataForRepository[1],
        allowNull: false,
        allowUndefined: false,
        messages: {
          invalid: BrandMessage.BRAND_ID_TYPE,
          undefined: BrandMessage.REQUIRED_BRAND_ID,
          null: BrandMessage.NULL_BRAND_ID,
          type: BrandMessage.BRAND_ID_TYPE,
        },
      }),
    )(
      'should fail when brandId is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('brandId');
        expect(errors[0].value).toEqual(data.brandId);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getFKAcceptableValues({
        property: 'brandId',
        dtoData: TestProductData.dataForRepository[1],
        allowNull: false,
        allowUndefined: false,
      }),
    )('should validate when brandId is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('categoryId', () => {
    it.each(
      getFKErrorDataList({
        property: 'categoryId',
        dtoData: TestProductData.dataForRepository[1],
        allowUndefined: false,
        allowNull: false,
        messages: {
          invalid: CategoryMessage.CATEGORY_ID_TYPE,
          type: CategoryMessage.CATEGORY_ID_TYPE,
          undefined: CategoryMessage.REQUIRED_CATEGORY_ID,
          null: CategoryMessage.NULL_CATEGORY_ID,
        },
      }),
    )(
      'should fail when categoryId is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('categoryId');
        expect(errors[0].value).toEqual(data.categoryId);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getFKAcceptableValues({
        property: 'categoryId',
        dtoData: TestProductData.dataForRepository[1],
        allowUndefined: false,
        allowNull: false,
      }),
    )('should validate when categoryId is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });
});
