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
  testValidateProductImage,
  testValidateProductImages,
} from '../../../../../test/product-image/test-product-image-utils';
import {
  TestProductInsertParams,
  testInsertProducts,
} from '../../../../../test/product/test-product-utils';
import { SortConstants } from '../../../../system/constants/sort/sort.constants';
import { Brand } from '../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../category/repositories/category.repository';
import { ProductConstants } from '../../../product/constants/product/product-entity.constants';
import { Product } from '../../../product/models/product/product.entity';
import { ProductImageConstants } from '../../constants/product-image/product-image-entity.constants';
import { ProductImage } from './product-image.entity';

describe('Image', () => {
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

  async function createTestScenario(quantity: 1 | 2 | 3) {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
    );
    const [categoryId1, categoryId2] = await insertCategories(
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentPosition: 1 },
    );
    const productData = [
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
    ].slice(0, quantity);
    const productIds = await insertProducts(...productData);
    const products = await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .getMany();
    return products;
  }

  it('should be defined', () => {
    expect(new ProductImage()).toBeDefined();
  });

  describe('create', () => {
    it('should insert images', async () => {
      const products = await createTestScenario(3);
      const [productImageId1, productImageId2, productImageId3] =
        await insertProductImages(
          {
            image: 'test/image1.jpg',
            thumbnail: 'test/thumbnails/image1.jpg',
            active: true,
            name: 'Image 1 name',
            description: 'Image 1 description',
            main: true,
            productId: products[0].id,
          },
          {
            image: 'test/image2.gif',
            thumbnail: null,
            active: false,
            name: null,
            description: null,
            main: false,
            productId: products[0].id,
          },
          {
            image: 'imag3.png',
            productId: products[1].id,
          },
        );
      const images = await productImageRepo
        .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
        .getMany();
      testValidateProductImages(images, [
        {
          image: 'test/image1.jpg',
          thumbnail: 'test/thumbnails/image1.jpg',
          name: 'Image 1 name',
          description: 'Image 1 description',
          main: true,
          active: true,
          productId: products[0].id,
        },
        {
          image: 'test/image2.gif',
          name: null,
          description: null,
          thumbnail: null,
          active: false,
          main: false,
          productId: products[0].id,
        },
        {
          name: null,
          description: null,
          image: 'imag3.png',
          thumbnail: null,
          active: false,
          main: false,
          productId: products[1].id,
        },
      ]);
    });

    describe('properties', () => {
      describe('image', () => {
        it(`should not insert when image is null`, async () => {
          const products = await createTestScenario(1);
          const fn = () =>
            insertProductImages({
              image: null,
              thumbnail: 'test/thumbnails/image1.jpg',
              active: true,
              name: 'Image 1 name',
              description: 'Image 1 description',
              main: true,
              productId: products[0].id,
            });
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: products_images.image`,
          );
        });

        it(`should not insert when image is undefined`, async () => {
          const products = await createTestScenario(1);
          const fn = () =>
            insertProductImages({
              image: undefined,
              thumbnail: 'test/thumbnails/image1.jpg',
              active: true,
              name: 'Image 1 name',
              description: 'Image 1 description',
              main: true,
              productId: products[0].id,
            });
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: products_images.image`,
          );
        });
      });

      describe('main', () => {
        it('should set main as false by default when main is undefined', async () => {
          const products = await createTestScenario(1);
          await insertProductImages({
            image: 'test/image1.jpg',
            thumbnail: 'test/thumbnails/image1.jpg',
            active: true,
            name: undefined,
            description: 'Image 1 description',
            main: undefined,
            productId: products[0].id,
          });
          const image = await productImageRepo
            .createQueryBuilder('products_images') // TODO: extract do constants
            .getOne();
          expect(image.main).toEqual(false);
        });
      });

      describe('active', () => {
        it('should set active as false by default when main is undefined', async () => {
          const products = await createTestScenario(1);
          await insertProductImages({
            image: 'test/image1.jpg',
            thumbnail: 'test/thumbnails/image1.jpg',
            active: undefined,
            name: 'Image 1 name',
            description: 'Image 1 description',
            main: true,
            productId: products[0].id,
          });
          const image = await productImageRepo
            .createQueryBuilder('products_images') // TODO: extract do constants
            .getOne();
          expect(image.active).toEqual(false);
        });
      });

      describe('productId', () => {
        it(`should not insert when productId is null`, async () => {
          await createTestScenario(1);
          const fn = async () =>
            insertProductImages({
              image: 'test/image1.jpg',
              thumbnail: 'test/thumbnails/image1.jpg',
              active: true,
              name: 'Image 1 name',
              description: 'Image 1 description',
              main: true,
              productId: null,
            });
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: products_images.productId`,
          );
        });

        it(`should not insert when productId is undefined`, async () => {
          await createTestScenario(1);
          const fn = async () =>
            insertProductImages({
              image: 'test/image1.jpg',
              thumbnail: 'test/thumbnails/image1.jpg',
              active: true,
              name: 'Image 1 name',
              description: 'Image 1 description',
              main: true,
              productId: undefined,
            });
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: products_images.productId`,
          );
        });
      });
    });
  });

  describe('find', () => {
    it('should find many', async () => {
      const products = await createTestScenario(3);
      const [productImageId1, productImageId2, productImageId3] =
        await insertProductImages(
          {
            name: 'Image 1',
            description: 'Image 1 description',
            image: 'test/image1.jpg',
            thumbnail: 'test/thumbnails/image1.jpg',
            main: true,
            active: true,
            productId: products[0].id,
          },
          {
            name: 'Image 2',
            description: null,
            image: 'test/image2.gif',
            thumbnail: null,
            main: false,
            active: false,
            productId: products[0].id,
          },
          {
            name: 'Image 3',
            image: 'image3.png',
            productId: products[1].id,
          },
        );
      const images = await productImageRepo
        .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
        .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
        .getMany();
      testValidateProductImages(images, [
        {
          id: productImageId1,
          name: 'Image 1',
          description: 'Image 1 description',
          image: 'test/image1.jpg',
          thumbnail: 'test/thumbnails/image1.jpg',
          main: true,
          active: true,
          productId: products[0].id,
        },
        {
          id: productImageId2,
          name: 'Image 2',
          description: null,
          image: 'test/image2.gif',
          thumbnail: null,
          main: false,
          active: false,
          productId: products[0].id,
        },
        {
          id: productImageId3,
          name: 'Image 3',
          description: null,
          image: 'image3.png',
          thumbnail: null,
          main: false,
          active: false,
          productId: products[1].id,
        },
      ]);
    });
  });

  describe('find one', () => {
    it('should find one image by id', async () => {
      const products = await createTestScenario(3);
      const [productImageId1, productImageId2, productImageId3] =
        await insertProductImages(
          {
            image: 'test/image1.jpg',
            thumbnail: 'test/thumbnails/image1.jpg',
            name: 'Image 1',
            description: 'Image 1 description',
            main: true,
            active: true,
            productId: products[0].id,
          },
          {
            image: 'test/image2.gif',
            thumbnail: null,
            name: 'Image 2',
            description: null,
            main: false,
            active: false,
            productId: products[0].id,
          },
          {
            name: 'Image 3',
            image: 'image3.png',
            productId: products[1].id,
          },
        );
      const image = await productImageRepo
        .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
        .where(ProductImageConstants.PRODUCT_IMAGE_ID_EQUALS_TO, {
          productImageId: productImageId2,
        })
        .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
        .getOne();
      testValidateProductImage(image, {
        name: 'Image 2',
        description: null,
        image: 'test/image2.gif',
        thumbnail: null,
        main: false,
        active: false,
        productId: products[0].id,
      });
    });
  });

  describe('soft delete', () => {
    it('should soft delete an image', async () => {
      const products = await createTestScenario(3);
      const [productImageId1, productImageId2, productImageId3] =
        await insertProductImages(
          {
            name: 'Image 1',
            description: 'Image 1 description',
            image: 'test/image1.jpg',
            thumbnail: 'test/thumbnails/image1.jpg',
            main: true,
            active: true,
            productId: products[0].id,
          },
          {
            name: 'Image 2',
            description: null,
            image: 'test/image2.gif',
            thumbnail: null,
            main: false,
            active: false,
            productId: products[0].id,
          },
          {
            name: 'Image 3',
            image: 'imag3.png',
            productId: products[1].id,
          },
        );
      const deleteReturn = await productImageRepo.softDelete(productImageId2);
      expect(deleteReturn?.affected).toEqual(1);
      expect(deleteReturn).toEqual({ affected: 1, generatedMaps: [], raw: [] });
      const images = await productImageRepo
        .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
        .withDeleted()
        .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME, SortConstants.ASC)
        .getMany();
      testValidateProductImages(images, [
        {
          name: 'Image 1',
          description: 'Image 1 description',
          image: 'test/image1.jpg',
          thumbnail: 'test/thumbnails/image1.jpg',
          active: true,
          main: true,
          productId: products[0].id,
        },
        {
          name: 'Image 2',
          description: null,
          image: 'test/image2.gif',
          thumbnail: null,
          main: false,
          active: false,
          productId: products[0].id,
          deleted: true,
        },
        {
          name: 'Image 3',
          description: null,
          image: 'imag3.png',
          thumbnail: null,
          main: false,
          active: false,
          productId: products[1].id,
        },
      ]);
    });
  });

  describe('update', () => {
    it('should update an image', async () => {
      const products = await createTestScenario(3);
      const [productImageId1, productImageId2, productImageId3] =
        await insertProductImages(
          {
            name: 'Image 1',
            description: 'Image 1 description',
            image: 'test/image1.jpg',
            thumbnail: 'test/thumbnails/image1.jpg',
            main: true,
            active: true,
            productId: products[0].id,
          },
          {
            name: 'Image 2',
            description: 'Imagee 2 description',
            image: 'test/image2.gif',
            thumbnail: null,
            main: false,
            active: false,
            productId: products[0].id,
          },
          {
            name: 'Image 3',
            image: 'imag3.png',
            productId: products[1].id,
          },
        );
      await productImageRepo.update(productImageId2, {
        image: 'newpath/subpath',
        description: null,
        active: true,
      });
      const images = await productImageRepo
        .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
        .orderBy(ProductImageConstants.PRODUCT_IMAGE_NAME)
        .getMany();
      testValidateProductImages(images, [
        {
          id: productImageId1,
          name: 'Image 1',
          description: 'Image 1 description',
          image: 'test/image1.jpg',
          thumbnail: 'test/thumbnails/image1.jpg',
          active: true,
          main: true,
          productId: products[0].id,
        },
        {
          id: productImageId2,
          name: 'Image 2',
          description: null,
          image: 'newpath/subpath',
          thumbnail: null,
          main: false,
          active: true,
          productId: products[0].id,
          deleted: true,
        },
        {
          id: productImageId3,
          name: 'Image 3',
          description: null,
          image: 'imag3.png',
          thumbnail: null,
          main: false,
          active: false,
          productId: products[1].id,
        },
      ]);
    });

    describe('properties', () => {
      describe('image', () => {
        it('should update when image is not defined', async () => {
          const products = await createTestScenario(3);
          const [productImageId1, productImageId2, productImageId3] =
            await insertProductImages(
              {
                image: 'test/image1.jpg',
                thumbnail: 'test/thumbnails/image1.jpg',
                active: true,
                name: 'Image 1 name',
                description: 'Image 1 description',
                main: true,
                productId: products[0].id,
              },
              {
                image: 'test/image2.gif',
                thumbnail: null,
                active: false,
                name: null,
                description: null,
                main: false,
                productId: products[0].id,
              },
              {
                image: 'imag3.png',
                productId: products[1].id,
              },
            );
          const fn = () =>
            productImageRepo.update(productImageId1, { name: 'New Name' });
          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it('should fail when image is null', async () => {
          const products = await createTestScenario(3);
          const [productImageId1, productImageId2, productImageId3] =
            await insertProductImages(
              {
                image: 'test/image1.jpg',
                thumbnail: 'test/thumbnails/image1.jpg',
                active: true,
                name: 'Image 1 name',
                description: 'Image 1 description',
                main: true,
                productId: products[0].id,
              },
              {
                image: 'test/image2.gif',
                thumbnail: null,
                active: false,
                name: null,
                description: null,
                main: false,
                productId: products[0].id,
              },
              {
                image: 'imag3.png',
                productId: products[1].id,
              },
            );
          const fn = () =>
            productImageRepo.update(
              productImageId1,
              productImageRepo.create({ name: 'New Name', image: null }),
            );
          await expect(fn()).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: products_images.image`,
          );
        });

        it('should update when image is undefined', async () => {
          const products = await createTestScenario(3);
          const [productImageId1, productImageId2, productImageId3] =
            await insertProductImages(
              {
                name: 'Image 1',
                description: 'Image 1 description',
                thumbnail: 'test/thumbnails/image1.jpg',
                image: 'test/image1.jpg',
                main: true,
                active: true,
                productId: products[0].id,
              },
              {
                name: 'Image 2',
                description: null,
                image: 'test/image2.gif',
                thumbnail: null,
                main: false,
                active: false,
                productId: products[0].id,
              },
              {
                name: 'Image 3',
                image: 'imag3.png',
                productId: products[1].id,
              },
            );
          await productImageRepo.update(
            productImageId1,
            productImageRepo.create({ name: 'Image 1 b', image: undefined }),
          );
          const images = await productImageRepo
            .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
            .orderBy(
              ProductImageConstants.PRODUCT_IMAGE_NAME,
              SortConstants.ASC,
            )
            .getMany();
          testValidateProductImages(images, [
            {
              name: 'Image 1 b',
              description: 'Image 1 description',
              image: 'test/image1.jpg',
              thumbnail: 'test/thumbnails/image1.jpg',
              main: true,
              active: true,
              productId: products[0].id,
            },
            {
              name: 'Image 2',
              description: null,
              image: 'test/image2.gif',
              thumbnail: null,
              main: false,
              active: false,
              productId: products[0].id,
            },
            {
              name: 'Image 3',
              description: null,
              image: 'imag3.png',
              thumbnail: null,
              main: false,
              active: false,
              productId: products[1].id,
            },
          ]);
        });
      });

      describe('thumbnail', () => {
        it('should update when thumbnail is not defined', async () => {
          const products = await createTestScenario(3);
          const [productImageId1, productImageId2, productImageId3] =
            await insertProductImages(
              {
                name: 'Image 1',
                description: 'Image 1 description',
                thumbnail: 'test/thumbnails/image1.jpg',
                image: 'test/image1.jpg',
                main: true,
                active: true,
                productId: products[0].id,
              },
              {
                name: 'Image 2',
                description: null,
                image: 'test/image2.gif',
                thumbnail: null,
                main: false,
                active: false,
                productId: products[0].id,
              },
              {
                name: 'Image 3',
                image: 'imag3.png',
                productId: products[1].id,
              },
            );
          const fn = () =>
            productImageRepo.update(productImageId1, {
              name: 'Image 1 b',
              active: true,
            });
          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
          const images = await productImageRepo
            .createQueryBuilder(ProductImageConstants.PRODUCT_IMAGE)
            .orderBy(
              ProductImageConstants.PRODUCT_IMAGE_NAME,
              SortConstants.ASC,
            )
            .getMany();
          testValidateProductImages(images, [
            {
              name: 'Image 1 b',
              description: 'Image 1 description',
              image: 'test/image1.jpg',
              thumbnail: 'test/thumbnails/image1.jpg',
              main: true,
              active: true,
              productId: products[0].id,
            },
            {
              name: 'Image 2',
              description: null,
              image: 'test/image2.gif',
              thumbnail: null,
              main: false,
              active: false,
              productId: products[0].id,
            },
            {
              name: 'Image 3',
              description: null,
              image: 'imag3.png',
              thumbnail: null,
              main: false,
              active: false,
              productId: products[1].id,
            },
          ]);
        });

        it('should update an image when thumbnail is null', async () => {
          const products = await createTestScenario(3);
          const [productImageId1, productImageId2, productImageId3] =
            await insertProductImages(
              {
                name: 'Image 1',
                description: 'Image 1 description',
                thumbnail: 'test/thumbnails/image1.jpg',
                image: 'test/image1.jpg',
                main: true,
                active: true,
                productId: products[0].id,
              },
              {
                name: 'Image 2',
                description: null,
                image: 'test/image2.gif',
                thumbnail: null,
                main: false,
                active: false,
                productId: products[0].id,
              },
              {
                name: 'Image 3',
                image: 'imag3.png',
                productId: products[1].id,
              },
            );
          const fn = () =>
            productImageRepo.update(
              productImageId2,
              productImageRepo.create({ image: null }),
            );
          await expect(fn()).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: products_images.image`,
          );
        });

        // TODO: undefined?
      });

      describe.skip('active', () => {
        it.skip('should update active', async () => {});
      });
    });
  });
});
