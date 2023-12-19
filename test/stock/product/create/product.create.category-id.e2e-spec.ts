import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryMessage } from '../../../../src/modules/stock/category/messages/category/category.messages.enum';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import {
  testValidateProduct,
  testValidateProducts,
} from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testPostMin,
} from '../../../utils/test-end-to-end.utils';

const CategoryIdMessage = new UuidMessage('category id');

describe('ProductController (e2e) - post /products (categoryId)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  async function insertCategories(
    ...categories: TestCategoryInsertParams[]
  ): Promise<string[]> {
    return testInsertCategories(categoryRepo, categories);
  }

  describe('categoryId', () => {
    it(`should accept create when categoryId is valid`, async () => {
      const [brandId1, brandId2] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
      );
      const [categoryId1, categoryId2] = await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
      );
      const data = {
        code: '001',
        name: 'Product 1',
        model: 'A1',
        price: 32.5,
        quantityInStock: 40,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      };
      const expectedResults = [
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
          brand: { id: brandId1, name: 'Brand 1', active: true },
          category: { id: categoryId1, name: 'Category 1', active: true },
          images: [],
        },
      ];
      const ret = await testPostMin(
        app,
        '/products',
        data,
        rootToken,
        HttpStatus.CREATED,
      );
      testValidateProduct(ret, expectedResults[0]);
      const products = await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .getMany();
      testValidateProducts(products, expectedResults);
    });

    it('should reject when categoryId is null', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: null,
        },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { categoryId: CategoryIdMessage.NULL },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when categoryId is undefined', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: undefined,
        },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { categoryId: CategoryIdMessage.REQUIRED },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when categoryId is number', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: 1,
        },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { categoryId: CategoryIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when categoryId is boolean', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: true,
        },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { categoryId: CategoryIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when categoryId is invalid string', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: 'not-a-valid-uuid',
        },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { categoryId: CategoryIdMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when categoryId is array', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: [],
        },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { categoryId: CategoryIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when categoryId is object', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: {},
        },
        rootToken,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { categoryId: CategoryIdMessage.STRING },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    });

    it('should reject when category is not found', async () => {
      const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
      const [categoryId1] = await insertCategories({
        name: 'Category 1',
        active: true,
      });
      const response = await testPostMin(
        app,
        '/products',
        {
          code: '001',
          name: 'Product 1',
          model: 'A1',
          price: 32.5,
          quantityInStock: 40,
          active: true,
          brandId: brandId1,
          categoryId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
        },
        rootToken,
        HttpStatus.NOT_FOUND,
      );
      expect(await productRepo.count()).toEqual(0);
      expect(response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: CategoryMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    });
  });
});
