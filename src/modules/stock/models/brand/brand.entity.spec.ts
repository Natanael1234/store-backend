import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestBrandData } from '../../../../test/brand/test-brand-data';
import { BrandEntity } from './brand.entity';

function validateBrand(
  expectedData: {
    name: string;
    active: boolean;
  },
  brand: BrandEntity,
  options?: {
    brandId?: number;
    deleted?: boolean;
  },
) {
  expect(brand).toBeInstanceOf(BrandEntity);
  if (options?.brandId) expect(brand.id).toEqual(options.brandId);

  expect(brand.name).toEqual(expectedData.name);
  expect(brand.active).toEqual(expectedData.active);

  expect(brand.created).toBeDefined();
  expect(brand.updated).toBeDefined();
  if (options?.deleted) {
    expect(brand.deletedAt).not.toBeNull();
  } else {
    expect(brand.deletedAt).toBeNull();
  }
}

describe('BrandEntity', () => {
  let module: TestingModule;
  let repo: Repository<BrandEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    repo = module.get<Repository<BrandEntity>>(getRepositoryToken(BrandEntity));
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  describe('create', () => {
    it('should insert brands', async () => {
      const brandsData = TestBrandData.dataForRepository;

      await repo.insert(repo.create(brandsData[0]));
      await repo.insert(repo.create(brandsData[1]));
      await repo.insert(repo.create(brandsData[2]));
      const expectedResults = [
        { ...brandsData[0], active: true },
        { ...brandsData[1], active: false },
        { ...brandsData[2], active: false },
      ];
      const brands = await repo.createQueryBuilder('brand').getMany();

      expect(brands).toHaveLength(3);
      expect(Array.isArray(brands)).toBe(true);
      validateBrand(expectedResults[0], brands[0], { brandId: 1 });
      validateBrand(expectedResults[1], brands[1], { brandId: 2 });
      validateBrand(expectedResults[2], brands[2], { brandId: 3 });
    });

    describe('properties', () => {
      describe('name', () => {
        it(`should not insert when name is not defined`, async () => {
          const brandsData = TestBrandData.dataForRepository;
          const fn = async () => {
            const data = { ...brandsData[0] };
            delete data.name;
            await repo.insert(repo.create(data));
          };

          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: brands.name`,
          );
        });
        it.each([
          { description: 'null', value: null },
          { description: 'undefined', value: undefined },
        ])(`should not insert when name is $description`, async ({ value }) => {
          const brandsData = TestBrandData.dataForRepository;
          const fn = async () => {
            const data = { ...brandsData[0] };
            data.name = value;
            await repo.insert(repo.create(data));
          };

          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: brands.name`,
          );
        });
      });

      describe('active', () => {
        it('should set active as false by default', async () => {
          const brandData = TestBrandData.dataForRepository[0];
          delete brandData.active;
          await repo.insert(repo.create(brandData));
          const brand = repo.createQueryBuilder('brand').getOne();
          expect((await brand).active).toEqual(false);
        });
      });
    });
  });

  describe('find', () => {
    it('should find users', async () => {
      const brandData = TestBrandData.dataForRepository;

      await repo.insert(repo.create(brandData[0]));
      await repo.insert(repo.create(brandData[1]));
      await repo.insert(repo.create(brandData[2]));

      const expectedResults = [
        { ...brandData[0], active: true },
        { ...brandData[1], active: false },
        { ...brandData[2], active: false },
      ];

      const insertedBrands = await repo.find();
      expect(Array.isArray(insertedBrands)).toBe(true);
      expect(insertedBrands).toHaveLength(3);

      validateBrand(expectedResults[0], insertedBrands[0], { brandId: 1 });
      validateBrand(expectedResults[1], insertedBrands[1], { brandId: 2 });
      validateBrand(expectedResults[2], insertedBrands[2], { brandId: 3 });
    });
  });

  describe('find one', () => {
    it('should find one user by id', async () => {
      const brandData = TestBrandData.dataForRepository;

      await repo.insert(repo.create(brandData[0]));
      await repo.insert(repo.create(brandData[1]));
      await repo.insert(repo.create(brandData[2]));

      const expectedResult = { ...brandData[1], active: false };

      const foundUser = await repo.findOne({ where: { id: 2 } });
      validateBrand(expectedResult, foundUser, { brandId: 2 });
    });
  });

  describe('soft delete', () => {
    it('should soft delete an user', async () => {
      const brandData = TestBrandData.dataForRepository;

      await repo.insert(repo.create(brandData[0]));
      await repo.insert(repo.create(brandData[1]));
      await repo.insert(repo.create(brandData[2]));

      const allExpectedResults = [
        { ...brandData[0], active: true },
        { ...brandData[1], active: false },
        { ...brandData[2], active: false },
      ];
      const expectedResults = [allExpectedResults[0], allExpectedResults[2]];

      const deleteReturn = await repo.softDelete(2);
      expect(deleteReturn?.affected).toEqual(1);

      expect(deleteReturn).toEqual(deleteReturn);
      const users = await repo.find();
      const allUsers = await repo.find({ withDeleted: true });

      expect(users).toHaveLength(2);
      validateBrand(expectedResults[0], users[0], { brandId: 1 });
      validateBrand(expectedResults[1], users[1], { brandId: 3 });

      expect(allUsers).toHaveLength(3);
      validateBrand(allExpectedResults[0], allUsers[0], { brandId: 1 });
      validateBrand(allExpectedResults[1], allUsers[1], {
        brandId: 2,
        deleted: true,
      });
      validateBrand(allExpectedResults[2], allUsers[2], { brandId: 3 });
    });
  });

  describe('update', () => {
    it('should update an user', async () => {
      const brandData = TestBrandData.dataForRepository;

      await repo.insert(repo.create(brandData[0]));
      await repo.insert(repo.create(brandData[1]));
      await repo.insert(repo.create(brandData[2]));

      const updateData = { name: 'Brand 2 a', active: true };
      const expectedResults = [
        { ...brandData[0], active: true },
        updateData,
        { ...brandData[2], active: false },
      ];
      await repo.update(2, updateData);
      const brands = await repo.find();

      expect(brands).toHaveLength(3);

      validateBrand(expectedResults[0], brands[0], { brandId: 1 });
      validateBrand(expectedResults[1], brands[1], { brandId: 2 });
      validateBrand(expectedResults[2], brands[2], { brandId: 3 });
    });

    describe('properties', () => {
      describe('name', () => {
        it('should accept when name is not defined', async () => {
          const brandData = TestBrandData.dataForRepository;
          await repo.insert(repo.create(brandData[0]));
          await repo.insert(repo.create(brandData[1]));
          await repo.insert(repo.create(brandData[2]));

          const fn = () => repo.update(2, {});

          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
        });

        it.each([
          { description: 'null', value: null },
          { description: 'undefined', value: undefined },
        ])(
          'should not insert an brand when name is $description',
          async ({ description, value }) => {
            const brandData = TestBrandData.dataForRepository;
            await repo.insert(repo.create(brandData[0]));
            await repo.insert(repo.create(brandData[1]));
            await repo.insert(repo.create(brandData[2]));

            const fn = () => repo.update(2, repo.create({ name: null }));

            await expect(fn()).rejects.toThrow(QueryFailedError);
            await expect(fn).rejects.toThrow(
              `SQLITE_CONSTRAINT: NOT NULL constraint failed: brands.name`,
            );
          },
        );
      });

      describe('active', () => {});
    });
  });
});
