import { TestProductData } from '../../../../../test/test-product-data';
import { validateFirstError } from '../../../../system/utils/validation';
import { CreateProductRequestDTO } from './create-product.request.dto';

describe('CreateProductRequestDTO', () => {
  it('should pass validation', async () => {
    const productData = TestProductData.dataForRepository;

    const errors = await validateFirstError(
      productData[0],
      CreateProductRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('code', () => {
    it.each(TestProductData.getCodeErrorDataList('create'))(
      'should fail validation when code is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('code');
        expect(errors[0].value).toEqual(data.code);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getCodeAcceptableValues('create'))(
      'should validate when code is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('name', () => {
    it.each(TestProductData.getNameErrorDataList('create'))(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getNameAcceptableValues('create'))(
      'should validate when name is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('model', () => {
    it.each(TestProductData.getModelErrorDataList('create'))(
      'should fail validation when model is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('model');
        expect(errors[0].value).toEqual(data.model);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getModelAcceptableValues('create'))(
      'should validate when model is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('price', () => {
    it.each(TestProductData.getPriceErrorDataList('create'))(
      'should fail when price is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('price');
        expect(errors[0].value).toEqual(data.price);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getModelAcceptableValues('create'))(
      'should validate when price is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('quantityInStock', () => {
    it.each(TestProductData.getQuantityInStockErrorDataList())(
      'should fail when quantity in stock is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('quantityInStock');
        expect(errors[0].value).toEqual(data.quantityInStock);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getQuantityInStockAcceptableValues('create'))(
      'should validate when quantity in stock is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('active', () => {
    it.each(TestProductData.getActiveErrorDataList())(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getActiveAcceptableValues())(
      'should validate when active is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });

  describe('brandId', () => {
    it.each(TestProductData.getActiveErrorDataList())(
      'should fail when brandId is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(TestProductData.getActiveAcceptableValues())(
      'should validate when brandId is $description',
      async ({ data }) => {
        const errors = await validateFirstError(data, CreateProductRequestDTO);
        expect(errors).toHaveLength(0);
      },
    );
  });
});
