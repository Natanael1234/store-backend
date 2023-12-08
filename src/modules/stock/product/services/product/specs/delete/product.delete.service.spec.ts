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
  TestProductInsertParams,
  testInsertProducts,
  testValidateProducts,
} from '../../../../../../../test/product/test-product-utils';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { ProductMessage } from '../../../../messages/product/product.messages.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

describe('ProductService', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productService = module.get<ProductService>(ProductService);
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

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

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
        const retDelete = await productService.delete(productId2);
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
        const fn = () => productService.delete(null);
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
          productService.delete('f136f640-90b7-11ed-a2a0-fd911f8f7f38');
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

      it.skip('should not delete if is active', async () => {});
    });
  });
});
