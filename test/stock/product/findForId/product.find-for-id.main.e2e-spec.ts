import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductImage } from '../../../../src/modules/stock/product-image/models/product-image/product-image.entity';
import { ProductMessage } from '../../../../src/modules/stock/product/messages/product/product.messages.enum';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../src/test/category/test-category-utils';
import {
  TestProductImageInsertParams,
  testInsertProductImages,
} from '../../../../src/test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
  testValidateProduct,
} from '../../../../src/test/product/test-product-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ProductIdMessage = new UuidMessage('product id');

describe('ProductController (e2e) - get /producs/:productId ', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;

  let rootToken: string;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    brandRepo = moduleFixture.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = moduleFixture.get<CategoryRepository>(CategoryRepository);
    productRepo = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );
    productImageRepo = moduleFixture.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(moduleFixture))
      .rootToken;
  });

  afterEach(async () => {
    await app.close();
    await moduleFixture.close(); // TODO: é necessário?
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

  async function insertProductImages(
    ...productImages: TestProductImageInsertParams[]
  ): Promise<string[]> {
    return testInsertProductImages(productImageRepo, productImages);
  }

  describe('product', () => {
    describe('findForId', () => {
      it('should find product', async () => {
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
        const product = await productRepo.findOne({
          where: { id: productId2 },
          relations: { brand: true, category: true, images: true },
        });
        const serviceProduct = await testGetMin(
          app,
          '/products/' + productId2,
          { query: JSON.stringify({}) },
          rootToken,
          HttpStatus.OK,
        );
        expect(serviceProduct).toBeDefined();
        testValidateProduct(serviceProduct, product);
      });

      it('should fail when productId is invalid', async () => {
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
        const response = await testGetMin(
          app,
          '/products/not-a-valid-uuid',
          { query: JSON.stringify({}) },
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
        const response = await testGetMin(
          app,
          '/products/f136f640-90b7-11ed-a2a0-fd911f8f7f38',
          { query: JSON.stringify({}) },
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
    });

    describe('find product and its images', () => {
      it('should bring image list together a product', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });

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
        );
        const [productImageId1, productImageId2, productImageId3] =
          await insertProductImages(
            {
              name: 'Image 1',
              description: 'Image 1 description',
              image: 'images/image1.jpg',
              thumbnail: 'thumbnails/images/image1.jpg',
              main: true,
              active: true,
              productId: productId1,
            },
            {
              image: 'images/image2.jpg',
              thumbnail: 'thumbnails/images/image2.jpg',
              main: false,
              active: false,
              productId: productId1,
            },
            {
              image: 'images/image3.jpg',
              thumbnail: 'thumbnails/images/image3.jpg',
              main: true,
              active: false,
              productId: productId2,
            },
          );
        const expectedProduct = {
          code: '00000001',
          name: 'Product 1',
          model: 'Model 1',
          price: 50,
          quantityInStock: 5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
          brand: { id: brandId1, name: 'Brand 1', active: true },
          category: { id: categoryId1, name: 'Category 1', active: true },
          images: [
            {
              id: productImageId1,
              name: 'Image 1',
              description: 'Image 1 description',
              image: 'images/image1.jpg',
              thumbnail: 'thumbnails/images/image1.jpg',
              main: true,
              active: true,
              productId: productId1,
            },
            {
              id: productImageId2,
              name: null,
              description: null,
              image: 'images/image2.jpg',
              thumbnail: 'thumbnails/images/image2.jpg',
              main: false,
              active: false,
              productId: productId1,
            },
          ],
        };
        const response = await testGetMin(
          app,
          '/products/' + productId1,
          { query: JSON.stringify({}) },
          rootToken,
          HttpStatus.OK,
        );
        testValidateProduct(response, expectedProduct);
      });

      it('should bring empty image list together a product', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const [productId1, productId2] = await insertProducts(
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
        );
        const expectedProduct = {
          code: '00000001',
          name: 'Product 1',
          model: 'Model 1',
          price: 50,
          quantityInStock: 5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
          brand: { id: brandId1, name: 'Brand 1', active: true },
          category: { id: categoryId1, name: 'Category 1', active: true },
          images: [],
        };
        const response = await testGetMin(
          app,
          '/products/' + productId1,
          { query: JSON.stringify({}) },
          rootToken,
          HttpStatus.OK,
        );
        testValidateProduct(response, expectedProduct);
      });
    });
  });
});
