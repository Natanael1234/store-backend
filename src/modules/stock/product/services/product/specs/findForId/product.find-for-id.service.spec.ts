import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import {
  TestProductImageInsertParams,
  testInsertProductImages,
} from '../../../../../../../test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
  testValidateProduct,
} from '../../../../../../../test/product/test-product-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductImage } from '../../../../../product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../product-image/services/product-image/product-image.service';
import { ProductMessage } from '../../../../messages/product/product.messages.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

describe('ProductService.findForId', () => {
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;
  let productService: ProductService;
  let productImageService: ProductImageService;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productImageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    productService = module.get<ProductService>(ProductService);
    productImageService = module.get<ProductImageService>(ProductImageService);
  });

  afterEach(async () => {
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

  async function insertProductImages(
    ...productImages: TestProductImageInsertParams[]
  ): Promise<string[]> {
    return testInsertProductImages(productImageRepo, productImages);
  }

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

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
        const serviceProduct = await productService.findById(productId2);
        expect(serviceProduct).toBeDefined();
        testValidateProduct(serviceProduct, product);
      });

      it('should fail when productId is not defined', async () => {
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

        const fn = () => productService.findById(null);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        expect(await productRepo.find()).toStrictEqual(productsBefore);
        await expect(fn()).rejects.toThrow(ProductMessage.ID_REQUIRED);

        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY,
            message: ProductMessage.ID_REQUIRED,
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
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
        const fn = () =>
          productService.findById('f136f640-90b7-11ed-a2a0-fd911f8f7f38');
        await expect(fn()).rejects.toThrow(NotFoundException);
        expect(await productRepo.find()).toStrictEqual(productsBefore);
        await expect(fn()).rejects.toThrow(ProductMessage.NOT_FOUND);

        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: ExceptionText.NOT_FOUND,
            message: ProductMessage.NOT_FOUND,
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
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
        const response = await productService.findById(productId1);
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
        const response = await productService.findById(productId1);
        testValidateProduct(response, expectedProduct);
      });
    });
  });
});
