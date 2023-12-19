import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { ProductMessage } from '../../../../src/modules/stock/product/messages/product/product.messages.enum';
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
  TestProductInsertParams,
  testInsertProducts,
  testValidateProducts,
} from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testDeleteMin,
} from '../../../utils/test-end-to-end.utils';

const ProductIdMessage = new UuidMessage('product id');

describe('ProductController (e2e) - delete /products/:productId (main)', () => {
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

  async function insertProducts(
    ...products: TestProductInsertParams[]
  ): Promise<string[]> {
    return testInsertProducts(productRepo, products);
  }

  describe('product', () => {
    describe('delete', () => {
      it('should delete product', async () => {
        const [brandId1, brandId2, brandId3] = await insertBrands(
          { name: 'Brand 1', active: true },
          { name: 'Brand 2', active: false },
          { name: 'Brand 3' },
        );
        const [categoryId1, categoryId2, categoryId3, categoryId4] =
          await insertCategories(
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: false, parentPosition: 2 },
            { name: 'Category 4', parentPosition: 1 },
          );
        const [productId1, productId2, productId3] = await insertProducts(
          {
            code: '00000001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          },
          {
            code: '00000002',
            name: 'Product 2',
            model: 'Model 2',
            price: 100,
            quantityInStock: 4,
            active: false,
            brandId: brandId1,
            categoryId: categoryId1,
          },
          {
            code: '00000003',
            name: 'Product 3',
            model: 'Model 3',
            price: 20,
            brandId: brandId2,
            categoryId: categoryId2,
          },
        );
        const retDelete = await testDeleteMin(
          app,
          `/products/${productId2}`,
          { query: `{}` },
          rootToken,
          HttpStatus.OK,
        );
        expect(retDelete).toEqual({ status: 'success' });
        const products = await productRepo
          .createQueryBuilder(ProductConstants.PRODUCT)
          .orderBy(ProductConstants.NAME, SortConstants.ASC)
          .withDeleted()
          .getMany();
        testValidateProducts(products, [
          {
            code: '00000001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          },
          {
            code: '00000002',
            name: 'Product 2',
            model: 'Model 2',
            price: 100,
            quantityInStock: 4,
            active: false,
            brandId: brandId1,
            categoryId: categoryId1,
            deleted: true,
          },
          {
            code: '00000003',
            name: 'Product 3',
            model: 'Model 3',
            price: 20,
            quantityInStock: 0,
            active: false,
            brandId: brandId2,
            categoryId: categoryId2,
          },
        ]);
      });

      it('should fail when productId is not valid', async () => {
        const [brandId1, brandId2, brandId3] = await insertBrands(
          { name: 'Brand 1', active: true },
          { name: 'Brand 2', active: false },
          { name: 'Brand 3' },
        );
        const [categoryId1, categoryId2, categoryId3, categoryId4] =
          await insertCategories(
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: false, parentPosition: 2 },
            { name: 'Category 4', parentPosition: 1 },
          );
        const [productId1, productId2, productId3] = await insertProducts(
          {
            code: '00000001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          },
          {
            code: '00000002',
            name: 'Product 2',
            model: 'Model 2',
            price: 100,
            quantityInStock: 4,
            active: false,
            brandId: brandId1,
            categoryId: categoryId1,
          },
          {
            code: '00000003',
            name: 'Product 3',
            model: 'Model 3',
            price: 20,
            brandId: brandId2,
            categoryId: categoryId2,
          },
        );
        const productsBefore = await productRepo.find();
        const response = await testDeleteMin(
          app,
          `/products/not-a-valid-uuid`,
          { query: `{}` },
          rootToken,
          HttpStatus.BAD_REQUEST,
        );
        expect(await productRepo.find()).toStrictEqual(productsBefore);
        expect(response).toEqual({
          error: ExceptionText.BAD_REQUEST,
          message: ProductIdMessage.INVALID,
          statusCode: HttpStatus.BAD_REQUEST,
        });
      });

      it('should fail when product does not exists', async () => {
        const [brandId1, brandId2, brandId3] = await insertBrands(
          { name: 'Brand 1', active: true },
          { name: 'Brand 2', active: false },
          { name: 'Brand 3' },
        );
        const [categoryId1, categoryId2, categoryId3, categoryId4] =
          await insertCategories(
            { name: 'Category 1', active: true },
            { name: 'Category 2', active: true, parentPosition: 1 },
            { name: 'Category 3', active: false, parentPosition: 2 },
            { name: 'Category 4', parentPosition: 1 },
          );
        const [productId1, productId2, productId3] = await insertProducts(
          {
            code: '00000001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          },
          {
            code: '00000002',
            name: 'Product 2',
            model: 'Model 2',
            price: 100,
            quantityInStock: 4,
            active: false,
            brandId: brandId1,
            categoryId: categoryId1,
          },
          {
            code: '00000003',
            name: 'Product 3',
            model: 'Model 3',
            price: 20,
            brandId: brandId2,
            categoryId: categoryId2,
          },
        );
        const productsBefore = await productRepo.find();
        const response = await testDeleteMin(
          app,
          `/products/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
          { query: `{}` },
          rootToken,
          HttpStatus.NOT_FOUND,
        );
        expect(await productRepo.find()).toStrictEqual(productsBefore);
        expect(response).toEqual({
          error: ExceptionText.NOT_FOUND,
          message: ProductMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      });

      it.skip('should not delete if is active', async () => {});
    });
  });
});
