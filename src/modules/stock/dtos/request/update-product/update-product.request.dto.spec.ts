import { TestProductData } from '../../../../../test/test-product-data';
import { validateFirstError } from '../../../../system/utils/validation';
import { UpdateProductRequestDTO } from './update-product.request.dto';

describe('UpdateProductRequestDTO', () => {
  it('should pass validation', async () => {
    const productData = TestProductData.dataForRepository;

    const errors = await validateFirstError(
      productData[0],
      UpdateProductRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('code', () => {
    it.each(TestProductData.getCodeErrorDataList('update'))(
      'should fail validation when code is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('code');
        expect(errors[0].value).toEqual(data.code);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getCodeAcceptableValues())(
      'should validate when code is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('name', () => {
    it.each(TestProductData.getNameErrorDataList('update'))(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getNameAcceptableValues())(
      'should validate when name is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('model', () => {
    it.each(TestProductData.getModelErrorDataList('update'))(
      'should fail validation when model is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('model');
        expect(errors[0].value).toEqual(data.model);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getModelAcceptableValues())(
      'should validate when model is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('price', () => {
    it.each(TestProductData.getPriceErrorDataList('update'))(
      'should fail when price is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('price');
        expect(errors[0].value).toEqual(data.price);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getModelAcceptableValues())(
      'should validate when price is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('quantityInStock', () => {
    it.each(TestProductData.getQuantityInStockErrorDataList())(
      'should fail when quantity in stock is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('quantityInStock');
        expect(errors[0].value).toEqual(data.quantityInStock);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getQuantityInStockAcceptableValues())(
      'should validate when quantity in stock is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('active', () => {
    it.each(TestProductData.getActiveErrorDataList())(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getActiveAcceptableValues())(
      'should validate when active is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('brandId', () => {
    it.each(TestProductData.getBrandIdErrorDataList('update'))(
      'should fail when brandId is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('brandId');
        expect(errors[0].value).toEqual(data.brandId);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getBrandIdAcceptableValues())(
      'should validate when brandId is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, UpdateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });
});
