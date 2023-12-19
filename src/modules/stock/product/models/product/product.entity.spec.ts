import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { getTestingModule } from '../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../test/category/test-category-utils';
import {
  TestProductImageInsertParams,
  testInsertProductImages,
} from '../../../../../test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
  testValidateProduct,
  testValidateProducts,
} from '../../../../../test/product/test-product-utils';
import { SortConstants } from '../../../../system/constants/sort/sort.constants';
import { BrandConstants } from '../../../brand/constants/brand/brand-entity.constants';
import { Brand } from '../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../category/repositories/category.repository';
import { ProductImage } from '../../../product-image/models/product-image/product-image.entity';
import { ProductConstants } from '../../constants/product/product-entity.constants';
import { Product } from './product.entity';

describe('Product entity', () => {
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let productRepo: Repository<Product>;
  let categoryRepo: CategoryRepository;
  let productImageRepo: Repository<ProductImage>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productImageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
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

  describe('create', () => {
    it('should insert products', async () => {
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
          quantityInStock: 0,
          brandId: brandId2,
          categoryId: categoryId2,
        },
      );
      const expectedResults = [
        {
          id: productId1,
          code: '00000001',
          name: 'Product 1',
          model: 'Model 1',
          price: 50,
          quantityInStock: 5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
          images: [],
        },
        {
          id: productId2,
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: brandId1,
          categoryId: categoryId1,
          images: [],
        },
        {
          id: productId3,
          code: '00000003',
          name: 'Product 3',
          model: 'Model 3',
          price: 20,
          quantityInStock: 0,
          active: false,
          brandId: brandId2,
          categoryId: categoryId2,
          images: [],
        },
      ];
      const products = await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .getMany();
      testValidateProducts(products, expectedResults);
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .leftJoinAndSelect(
          BrandConstants.BRAND_PRODUCTS,
          BrandConstants.PRODUCTS,
        )
        .getMany();
      expect(brands[0].products).toHaveLength(2);
      expect(brands[1].products).toHaveLength(1);
      expect(brands[2].products).toHaveLength(0);
    });

    describe('code', () => {
      it('should not insert when code is null', async () => {
        const [brandId1, brandId2, brandId3] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1, categoryId2, categoryId3, categoryId4] =
          await insertCategories({ name: 'Brand 1', active: true });
        const fn = async () =>
          insertProducts({
            code: null,
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.code`,
        );
      });

      it('should not insert when code is undefined', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: null,
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.code`,
        );
      });
    });

    describe('name', () => {
      it('should not insert when name is null', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: '00001',
            name: null,
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.name`,
        );
      });

      it('should not insert when name is undefined', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });

        const fn = async () =>
          insertProducts({
            code: '00001',
            name: undefined,
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.name`,
        );
      });
    });

    describe('price', () => {
      it('should not insert when price is null', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: '00001',
            name: 'Product 1',
            model: 'Model 1',
            price: null,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.price`,
        );
      });

      it('should not insert when price is undefined', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: '00001',
            name: 'Product 1',
            model: 'Model 1',
            price: undefined,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.price`,
        );
      });
    });

    describe('brandId', () => {
      it('should not insert when brandId is null', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: '00001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: null,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.brandId`,
        );
      });

      it('should not insert when brandId is undefined', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: '00001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: undefined,
            categoryId: categoryId1,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.brandId`,
        );
      });

      it('should fail if brand does not exists', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          productRepo
            .createQueryBuilder(ProductConstants.PRODUCT)
            .createQueryBuilder()
            .insert()
            .into(Product)
            .values([
              {
                code: '00001',
                name: 'Product 1',
                model: 'Model 1',
                price: 50,
                quantityInStock: 5,
                active: true,
                brandId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
                categoryId: categoryId1,
              },
            ])
            .execute();
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`,
        );
      });
    });

    describe('categoryId', () => {
      it('should not insert when categoryId is null', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: '00001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: null,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.categoryId`,
        );
      });

      it('should not insert when categoryId is undefined', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Brand 1',
          active: true,
        });
        const fn = async () =>
          insertProducts({
            code: '00001',
            name: 'Product 1',
            model: 'Model 1',
            price: 50,
            quantityInStock: 5,
            active: true,
            brandId: brandId1,
            categoryId: undefined,
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.categoryId`,
        );
      });

      it('should fail if category does not exists', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const fn = async () =>
          productRepo
            .createQueryBuilder(ProductConstants.PRODUCT)
            .createQueryBuilder()
            .insert()
            .into(Product)
            .values([
              {
                code: '00001',
                name: 'Product 1',
                model: 'Model 1',
                price: 50,
                quantityInStock: 5,
                active: true,
                brandId: brandId1,
                categoryId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
              },
            ])
            .execute();
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`,
        );
      });
    });

    describe('active', () => {
      it('should set active as false by default', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        await insertProducts({
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: undefined,
          brandId: brandId1,
          categoryId: categoryId1,
        });
        const product = await productRepo
          .createQueryBuilder(ProductConstants.PRODUCT)
          .getOne();
        expect(product.active).toEqual(false);
      });
    });

    describe('quantityInStock', () => {
      it('should set quantityInStock as 0 by default', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        await insertProducts({
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          // quantityInStock: ,
          active: false,
          brandId: brandId1,
          categoryId: categoryId1,
        });
        const product = productRepo
          .createQueryBuilder(ProductConstants.PRODUCT)
          .getOne();
        expect((await product).quantityInStock).toEqual(0);
      });
    });

    describe('images', () => {
      it('should save images of product', async () => {
        const [brandId1] = await insertBrands({
          name: 'Brand 1',
          active: true,
        });
        const [categoryId1] = await insertCategories({
          name: 'Category 1',
          active: true,
        });
        const [productId1] = await insertProducts({
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: brandId1,
          categoryId: categoryId1,
        });
        const [productImageId1, productImageId2] = await insertProductImages(
          {
            name: 'Image 1',
            description: 'Image 1 description',
            image: 'path/to/image1.jpg',
            thumbnail: 'path/to/image/thumbnail1.jpg',
            active: true,
            main: true,
            productId: productId1,
          },
          {
            image: 'path/to/image2.jpg',
            thumbnail: 'path/to/image/thumbnail2.jpg',
            productId: productId1,
          },
        );
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
          .orderBy(ProductConstants.IMAGES_NAME, SortConstants.DESC)
          .getMany();
        expect(Array.isArray(products)).toBe(true);
        expect(products).toHaveLength(1);
        testValidateProducts(products, [
          {
            code: '00000002',
            name: 'Product 2',
            model: 'Model 2',
            price: 100,
            quantityInStock: 4,
            active: false,
            brandId: brandId1,
            categoryId: categoryId1,
            brand: { id: brandId1, name: 'Brand 1', active: true },
            category: { id: categoryId1, name: 'Category 1', active: true },
            images: [
              {
                id: productImageId1,
                name: 'Image 1',
                description: 'Image 1 description',
                image: 'path/to/image1.jpg',
                thumbnail: 'path/to/image/thumbnail1.jpg',
                active: true,
                main: true,
                productId: productId1,
              },
              {
                id: productImageId2,
                name: null,
                description: null,
                image: 'path/to/image2.jpg',
                thumbnail: 'path/to/image/thumbnail2.jpg',
                active: false,
                main: false,
                productId: productId1,
              },
            ],
          },
        ]);
      });
    });
  });

  describe('find', () => {
    it('should find products', async () => {
      const [brandId1, brandId2, brandId3] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const [categoryId1, categoryId2, categoryId3] = await insertCategories(
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
          price: 2.1,
          quantityInStock: 34,
          brandId: brandId2,
          categoryId: categoryId2,
        },
      );
      const [productImageId1, productImageId2] = await insertProductImages(
        {
          name: 'Image 1',
          description: 'Image 1 description',
          image: 'path/to/image1.jpg',
          thumbnail: 'path/to/image/thumbnail1.jpg',
          active: true,
          main: true,
          productId: productId1,
        },
        {
          image: 'path/to/image2.jpg',
          thumbnail: 'path/to/image/thumbnail2.jpg',
          productId: productId1,
        },
      );
      const expectedProducts = [
        {
          id: productId1,
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
              image: 'path/to/image1.jpg',
              thumbnail: 'path/to/image/thumbnail1.jpg',
              active: true,
              main: true,
              productId: productId1,
            },
            {
              id: productImageId2,
              name: null,
              description: null,
              image: 'path/to/image2.jpg',
              thumbnail: 'path/to/image/thumbnail2.jpg',
              active: false,
              main: false,
              productId: productId1,
            },
          ],
        },
        {
          id: productId2,
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: brandId1,
          categoryId: categoryId1,
          brand: { id: brandId1, name: 'Brand 1', active: true },
          category: { id: categoryId1, name: 'Category 1', active: true },
          images: [],
        },
        {
          id: productId3,
          code: '00000003',
          name: 'Product 3',
          model: 'Model 3',
          price: 2.1,
          quantityInStock: 34,
          active: false,
          brandId: brandId2,
          categoryId: categoryId2,
          brand: { id: brandId2, name: 'Brand 2', active: false },
          category: { id: categoryId2, name: 'Category 2', active: true },
          images: [],
        },
      ];
      const products = await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
        .addOrderBy(ProductConstants.IMAGES_NAME, SortConstants.DESC)
        .getMany();
      testValidateProducts(products, expectedProducts);
      testValidateProduct;
    });
  });

  describe('find one', () => {
    it('should find one product by id', async () => {
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
      const product = await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .where(ProductConstants.PRODUCT_ID_EQUALS_TO, { productId: productId2 })
        .getOne();
      testValidateProduct(product, {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
      });
    });
  });

  describe('soft delete', () => {
    it('should soft delete an product', async () => {
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
      await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .softDelete()
        .from(Product)
        .where('id = :productId', { productId: productId2 })
        .execute();
      const products = await productRepo
        .createQueryBuilder(ProductConstants.PRODUCT)
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_CATEGORY,
          ProductConstants.CATEGORY,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_BRAND,
          ProductConstants.BRAND,
        )
        .leftJoinAndSelect(
          ProductConstants.PRODUCT_IMAGES,
          ProductConstants.IMAGES,
        )
        .withDeleted()
        .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
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
          brand: { id: brandId1, name: 'Brand 1', active: true },
          category: { id: categoryId1, name: 'Category 1', active: true },
          images: [],
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
          brand: { id: brandId1, name: 'Brand 1', active: true },
          category: { id: categoryId1, name: 'Category 1', active: true },
          images: [],
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
          brand: { id: brandId2, name: 'Brand 2', active: false },
          category: { id: categoryId2, name: 'Category 2', active: true },
          images: [],
        },
      ]);
    });
  });

  describe('update', () => {
    it('should update an product', async () => {
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
      const [productId1, productId2, productId3] = await insertProducts({
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 50,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      });
      await productRepo
        .createQueryBuilder()
        .update()
        .set({
          code: 'new code',
          name: 'New Name',
          model: 'new model',
          price: 200,
          quantityInStock: 55.5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
        })
        .where('id = :productId', { productId: productId1 })
        .execute();
      const productsAfter = await productRepo
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
      testValidateProducts(productsAfter, [
        {
          id: productId1,
          code: 'new code',
          name: 'New Name',
          model: 'new model',
          price: 200,
          quantityInStock: 55.5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
          brand: { id: brandId1, name: 'Brand 1', active: true },
          category: { id: categoryId1, name: 'Category 1', active: true },
          images: [],
        },
      ]);
    });

    it('should accept all properties empty', async () => {
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
      const fn = () => productRepo.update(productId2, {});
      await expect(fn()).resolves.toEqual({
        affected: 1,
        generatedMaps: [],
        raw: [],
      });
    });

    async function testReject(property: string, data: any) {
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
      const fn = () => productRepo.update(productId1, data);
      await expect(fn()).rejects.toThrow(QueryFailedError);
      await expect(fn).rejects.toThrow(
        `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.${property}`,
      );
    }

    it('should fail update an product when code is null', async () => {
      await testReject('code', { code: null });
    });

    it('should fail update an product when name is null', async () => {
      await testReject('name', { name: null });
    });

    it('should fail update an product when model is null', async () => {
      await testReject('model', { model: null });
    });

    it('should fail update an product when price is null', async () => {
      await testReject('price', { price: null });
    });

    it('should fail update an product when active is null', async () => {
      await testReject('active', { active: null });
    });

    it('should fail update an product when brandId is null', async () => {
      await testReject('brandId', { brandId: null });
    });

    it('should fail update an product when categoryId is null', async () => {
      await testReject('categoryId', { categoryId: null });
    });

    describe('brandId', () => {
      it('should fail if brand does not exists', async () => {
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
        const fn = async () =>
          productRepo.update(productId1, {
            brandId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`,
        );
      });
    });

    describe('categoryId', () => {
      it('should fail if category does not exists', async () => {
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
        const fn = async () =>
          productRepo.update(productId1, {
            categoryId: 'f136f640-90b7-11ed-a2a0-fd911f8f7f38',
          });
        await expect(fn).rejects.toThrow(QueryFailedError);
        await expect(fn).rejects.toThrow(
          `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`,
        );
      });
    });
  });
});
