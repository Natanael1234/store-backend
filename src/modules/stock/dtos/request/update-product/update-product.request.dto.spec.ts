import { TestProductData } from '../../../../../test/product/test-product-data';
import { TestPurpose } from '../../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../../test/test-data/test-active-data';
import {
  getBrandIdAcceptableValues,
  getBrandIdErrorDataList,
} from '../../../../../test/test-data/test-brand-id.-data';
import {
  getCodeAcceptableValues,
  getCodeErrorDataList,
} from '../../../../../test/test-data/test-code-data';
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
import { UpdateProductRequestDTO } from './update-product.request.dto';

describe('UpdateProductRequestDTO', () => {
  it('should pass validation', async () => {
    const errors = await validateFirstError(
      TestProductData.dataForRepository[1],
      UpdateProductRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('code', () => {
    it.each(
      getCodeErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )(
      'should fail validation when code is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('code');
        expect(errors[0].value).toEqual(data.code);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getCodeAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )('should validate when code is $description', async ({ data }) => {
      const errors = await validateFirstError(data, UpdateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('name', () => {
    it.each(
      getNameErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getNameAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )('should validate when name is $description', async ({ data }) => {
      const errors = await validateFirstError(data, UpdateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('model', () => {
    it.each(
      getModelErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )(
      'should fail validation when model is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('model');
        expect(errors[0].value).toEqual(data.model);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getModelAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )('should validate when model is $description', async ({ data }) => {
      const errors = await validateFirstError(data, UpdateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('price', () => {
    it.each(
      getPriceErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )(
      'should fail when price is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('price');
        expect(errors[0].value).toEqual(data.price);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getModelAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )('should validate when price is $description', async ({ data }) => {
      const errors = await validateFirstError(data, UpdateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('quantityInStock', () => {
    it.each(
      getQuantityInStockErrorDataList(TestProductData.dataForRepository[1]),
    )(
      'should fail when quantity in stock is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('quantityInStock');
        expect(errors[0].value).toEqual(data.quantityInStock);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getQuantityInStockAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )(
      'should validate when quantity in stock is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('active', () => {
    it.each(getActiveErrorDataList(TestProductData.dataForRepository[1]))(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(getActiveAcceptableValues(TestProductData.dataForRepository[1]))(
      'should validate when active is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('brandId', () => {
    it.each(
      getBrandIdErrorDataList(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )(
      'should fail when brandId is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('brandId');
        expect(errors[0].value).toEqual(data.brandId);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getBrandIdAcceptableValues(
        TestProductData.dataForRepository[1],
        TestPurpose.update,
      ),
    )('should validate when brandId is $description', async ({ data }) => {
      const errors = await validateFirstError(data, UpdateProductRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });
});
