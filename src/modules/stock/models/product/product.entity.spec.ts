import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestBrandData } from '../../../../test/brand/test-brand-data';
import { TestProductData } from '../../../../test/product/test-product-data';
import { BrandEntity } from '../brand/brand.entity';
import { ProductEntity } from './product.entity';

function validateProduct(
  expectedData: {
    code: string;
    name: string;
    model: string;
    price: number;
    quantityInStock?: number;
    active?: boolean; // TODO: testar
    brandId: number;
  },
  product: ProductEntity,
  options?: {
    productId?: number;
    deleted?: boolean;
  },
) {
  expect(product).toBeInstanceOf(ProductEntity);
  if (options?.productId) expect(product.id).toEqual(options.productId);

  expect(product.code).toEqual(expectedData.code);
  expect(product.name).toEqual(expectedData.name);
  expect(product.model).toEqual(expectedData.model);
  expect(product.price).toEqual(expectedData.price);
  expect(product.quantityInStock).toEqual(expectedData.quantityInStock);
  expect(product.brandId).toEqual(expectedData.brandId);
  expect(product.created).toBeDefined();
  expect(product.updated).toBeDefined();
  if (options?.deleted) {
    expect(product.deletedAt).not.toBeNull();
  } else {
    expect(product.deletedAt).toBeNull();
  }
}

describe('ProductEntity', () => {
  let module: TestingModule;
  let brandsRepo: Repository<BrandEntity>;
  let productRepo: Repository<ProductEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandsRepo = module.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );
    productRepo = module.get<Repository<ProductEntity>>(
      getRepositoryToken(ProductEntity),
    );
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should insert products', async () => {
      const productData = TestProductData.dataForRepository;
      const brandsData = TestBrandData.dataForRepository;

      await brandsRepo.insert(brandsData[0]);
      await brandsRepo.insert(brandsData[1]);
      await brandsRepo.insert(brandsData[2]);

      await productRepo.insert(productData[0]);
      await productRepo.insert(productData[1]);
      await productRepo.insert(productData[2]);

      const expectedResults = [
        productData[0],
        productData[1],
        { ...productData[2], quantityInStock: 0, active: false },
      ];
      const products = await productRepo
        .createQueryBuilder('product')
        .getMany();

      const brands = await brandsRepo.find({
        relations: { products: true },
      });

      expect(products).toHaveLength(3);
      expect(Array.isArray(products)).toBe(true);
      validateProduct(expectedResults[0], products[0], { productId: 1 });
      validateProduct(expectedResults[1], products[1], { productId: 2 });
      validateProduct(expectedResults[2], products[2], { productId: 3 });

      expect(brands[0].products).toHaveLength(2);
      expect(brands[1].products).toHaveLength(1);
      expect(brands[2].products).toHaveLength(0);
    });

    it('should fail if brand does not exists', async () => {
      const productData = TestProductData.dataForRepository;
      const brandsData = TestBrandData.dataForRepository;

      await brandsRepo.insert(brandsData[0]);
      await brandsRepo.insert(brandsData[1]);
      await brandsRepo.insert(brandsData[2]);

      await productRepo.insert(productData[0]);
      await productRepo.insert(productData[1]);

      const fn = async () => {
        const data = { ...productData[2], brandId: 200 };
        await productRepo.insert(productRepo.create(data));
      };

      await expect(fn).rejects.toThrow(QueryFailedError);
      await expect(fn).rejects.toThrow(
        `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`,
      );
    });

    describe('properties', () => {
      describe.each([
        { property: 'code' },
        { property: 'name' },
        { property: 'model' },
        { property: 'price' },
        { property: 'brandId' },
      ])(``, ({ property }) => {
        describe('not defined', () => {
          it(`should not insert when ${property} is not defined`, async () => {
            const brandsData = TestBrandData.dataForRepository;
            const productData = TestProductData.dataForRepository;

            await brandsRepo.insert(brandsData[0]);
            await brandsRepo.insert(brandsData[1]);
            await brandsRepo.insert(brandsData[2]);

            const fn = async () => {
              const data = { ...productData[0] };
              delete data[property];
              await productRepo.insert(productRepo.create(data));
            };

            await expect(fn).rejects.toThrow(QueryFailedError);
            await expect(fn).rejects.toThrow(
              `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.${property}`,
            );
          });
        });

        describe.each([
          { valueDescription: 'null', value: null },
          { valueDescription: 'undefined', value: undefined },
        ])('$valueDescription', ({ valueDescription, value }) => {
          it(`should not insert when ${property} is ${valueDescription}`, async () => {
            const brandsData = TestBrandData.dataForRepository;
            const productData = TestProductData.dataForRepository;

            await brandsRepo.insert(brandsData[0]);
            await brandsRepo.insert(brandsData[1]);
            await brandsRepo.insert(brandsData[2]);

            const fn = async () => {
              const data = { ...productData[0] };
              data[property] = value;
              await productRepo.insert(productRepo.create(data));
            };

            await expect(fn).rejects.toThrow(QueryFailedError);
            await expect(fn).rejects.toThrow(
              `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.${property}`,
            );
          });
        });
      });

      it('should set quantityInStock as 0 by default', async () => {
        const brandsData = TestBrandData.dataForRepository;
        const productData = TestProductData.dataForRepository[0];

        await brandsRepo.insert(brandsData[0]);
        await brandsRepo.insert(brandsData[1]);
        await brandsRepo.insert(brandsData[2]);

        delete productData.quantityInStock;
        await productRepo.insert(productRepo.create(productData));
        const product = productRepo.createQueryBuilder('product').getOne();
        expect((await product).quantityInStock).toEqual(0);
      });

      it('should set active as false by default', async () => {
        const brandsData = TestBrandData.dataForRepository;
        const productData = TestProductData.dataForRepository[0];

        await brandsRepo.insert(brandsData[0]);
        await brandsRepo.insert(brandsData[1]);
        await brandsRepo.insert(brandsData[2]);

        delete productData.active;
        await productRepo.insert(productData);
        const product = await productRepo
          .createQueryBuilder('product')
          .getOne();
        expect(product.active).toEqual(false);
      });
    });
  });

  describe('find', () => {
    it('should find users', async () => {
      const productData = TestProductData.dataForRepository;
      const brandsData = TestBrandData.dataForRepository;

      await brandsRepo.insert(brandsData[0]);
      await brandsRepo.insert(brandsData[1]);
      await brandsRepo.insert(brandsData[2]);

      await productRepo.insert(productData[0]);
      await productRepo.insert(productData[1]);
      await productRepo.insert(productData[2]);

      const expectedResults = [
        productData[0],
        productData[1],
        { ...productData[2], quantityInStock: 0, active: false },
      ];

      const insertedProducts = await productRepo.find();
      expect(Array.isArray(insertedProducts)).toBe(true);
      expect(insertedProducts).toHaveLength(3);

      validateProduct(expectedResults[0], insertedProducts[0], {
        productId: 1,
      });
      validateProduct(expectedResults[1], insertedProducts[1], {
        productId: 2,
      });
      validateProduct(expectedResults[2], insertedProducts[2], {
        productId: 3,
      });
    });
  });

  describe('find one', () => {
    it('should find one user by id', async () => {
      const productData = TestProductData.dataForRepository;
      const brandsData = TestBrandData.dataForRepository;

      await brandsRepo.insert(brandsData[0]);
      await brandsRepo.insert(brandsData[1]);
      await brandsRepo.insert(brandsData[2]);

      await productRepo.insert(productData[0]);
      await productRepo.insert(productData[1]);
      await productRepo.insert(productData[2]);

      const expectedResult = productData[1];

      const foundUser = await productRepo.findOne({ where: { id: 2 } });
      validateProduct(expectedResult, foundUser, { productId: 2 });
    });
  });

  describe('soft delete', () => {
    it('should soft delete an user', async () => {
      const productData = TestProductData.dataForRepository;
      const brandsData = TestBrandData.dataForRepository;

      await brandsRepo.insert(brandsData[0]);
      await brandsRepo.insert(brandsData[1]);
      await brandsRepo.insert(brandsData[2]);

      await productRepo.insert(productData[0]);
      await productRepo.insert(productData[1]);
      await productRepo.insert(productData[2]);

      const allExpectedResults = [
        productData[0],
        productData[1],
        { ...productData[2], quantityInStock: 0, active: false },
      ];
      const expectedResults = [allExpectedResults[0], allExpectedResults[2]];

      const deleteReturn = await productRepo.softDelete(2);
      expect(deleteReturn?.affected).toEqual(1);

      expect(deleteReturn).toEqual(deleteReturn);
      const users = await productRepo.find();
      const allUsers = await productRepo.find({ withDeleted: true });

      expect(users).toHaveLength(2);
      validateProduct(expectedResults[0], users[0], { productId: 1 });
      validateProduct(expectedResults[1], users[1], { productId: 3 });

      expect(allUsers).toHaveLength(3);
      validateProduct(allExpectedResults[0], allUsers[0], { productId: 1 });
      validateProduct(allExpectedResults[1], allUsers[1], {
        productId: 2,
        deleted: true,
      });
      validateProduct(allExpectedResults[2], allUsers[2], { productId: 3 });
    });
  });

  describe('update', () => {
    it('should fail if brand does not exists', async () => {
      const productData = TestProductData.dataForRepository;
      const brandsData = TestBrandData.dataForRepository;

      await brandsRepo.insert(brandsData[0]);
      await brandsRepo.insert(brandsData[1]);
      await brandsRepo.insert(brandsData[2]);

      await productRepo.insert(productData[0]);
      await productRepo.insert(productData[1]);
      await productRepo.insert(productData[2]);

      const fn = async () => {
        const data = { brandId: 200 };
        await productRepo.update(1, data);
      };

      await expect(fn).rejects.toThrow(QueryFailedError);
      await expect(fn).rejects.toThrow(
        `SQLITE_CONSTRAINT: FOREIGN KEY constraint failed`,
      );
    });

    it('should update an user', async () => {
      const productData = TestProductData.dataForRepository;
      const brandsData = TestBrandData.dataForRepository;

      await brandsRepo.insert(brandsData[0]);
      await brandsRepo.insert(brandsData[1]);
      await brandsRepo.insert(brandsData[2]);

      await productRepo.insert(productData[0]);
      await productRepo.insert(productData[1]);
      await productRepo.insert(productData[2]);

      const updateData = {
        code: '00000002a',
        name: 'Product 2 a',
        model: 'Model 2 a',
        price: 90,
        quantityInStock: 6,
        active: true,
        brandId: 1,
      };
      const expectedResults = [
        productData[0],
        updateData,
        { ...productData[2], quantityInStock: 0, active: false },
      ];
      await productRepo.update(2, updateData);
      const products = await productRepo.find();

      expect(products).toHaveLength(3);

      validateProduct(expectedResults[0], products[0], { productId: 1 });
      validateProduct(expectedResults[1], products[1], { productId: 2 });
      validateProduct(expectedResults[2], products[2], { productId: 3 });
    });

    describe('properties', () => {
      it('should accept empty properties', async () => {
        const brandsData = TestBrandData.dataForRepository;
        const productData = TestProductData.dataForRepository;

        await brandsRepo.insert(brandsData[0]);
        await brandsRepo.insert(brandsData[1]);
        await brandsRepo.insert(brandsData[2]);

        await productRepo.insert(productData[0]);
        await productRepo.insert(productData[1]);
        await productRepo.insert(productData[2]);

        const fn = () => productRepo.update(2, {});

        await expect(fn()).resolves.toEqual({
          affected: 1,
          generatedMaps: [],
          raw: [],
        });
      });

      describe('name', () => {
        describe('empty', () => {});

        describe.each([
          { description: 'null', value: null },
          { description: 'undefined', value: undefined },
        ])('$description', ({ description, value }) => {
          it.each([
            { property: 'code' },
            { property: 'name' },
            { property: 'model' },
            { property: 'price' },
            // { property: 'manufacturer' } TODO:
          ])(
            'should not insert an product when $property is ' + description,
            async ({ property }) => {
              const brandsData = TestBrandData.dataForRepository;
              const productData = TestProductData.dataForRepository;

              await brandsRepo.insert(brandsData[0]);
              await brandsRepo.insert(brandsData[1]);
              await brandsRepo.insert(brandsData[2]);

              await productRepo.insert(productData[0]);
              await productRepo.insert(productData[1]);
              await productRepo.insert(productData[2]);

              const fn = () => productRepo.update(2, { [property]: null });

              await expect(fn()).rejects.toThrow(QueryFailedError);
              await expect(fn).rejects.toThrow(
                `SQLITE_CONSTRAINT: NOT NULL constraint failed: products.${property}`,
              );
            },
          );
        });
      });
    });
  });
});
