import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { getTestingModule } from '../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../test/brand/test-brand-utils';
import { BrandConstants } from '../../constants/brand/brand-entity.constants';
import { Brand } from './brand.entity';

function validateBrand(
  expectedData: { name: string; active: boolean; deleted?: boolean },
  brand: Brand,
) {
  expect(brand).toBeInstanceOf(Brand);
  expect(brand.id).toBeDefined();
  expect(brand.name).toEqual(expectedData.name);
  expect(brand.active).toEqual(expectedData.active);
  expect(brand.created).toBeDefined();
  expect(brand.updated).toBeDefined();
  if (expectedData.deleted) {
    expect(brand.deletedAt).not.toBeNull();
  } else {
    expect(brand.deletedAt).toBeNull();
  }
}

// TODO: remover
function validateBrands(
  expectedBrandsData: { name: string; active: boolean; deleted?: boolean }[],
  brands: Brand[],
) {
  expect(brands).toBeDefined();
  expect(brands).toHaveLength(expectedBrandsData.length);
  const nonRepeatedIds = [...new Set(brands.map((b) => b.id))];
  expect(nonRepeatedIds).toHaveLength(brands.length);
  for (let i = 0; i < expectedBrandsData.length; i++) {
    validateBrand(expectedBrandsData[i], brands[i]);
  }
}

describe('Brand entity', () => {
  let module: TestingModule;
  let brandRepo: Repository<Brand>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  describe('create', () => {
    it('should insert brands', async () => {
      await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const brands = await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .orderBy(BrandConstants.BRAND_NAME)
        .getMany();
      validateBrands(
        [
          { name: 'Brand 1', active: true },
          { name: 'Brand 2', active: false },
          { name: 'Brand 3', active: false },
        ],
        brands,
      );
    });

    describe('properties', () => {
      describe('name', () => {
        it(`should not insert when name is not defined`, async () => {
          await insertBrands(
            { name: 'Brand 1', active: true },
            { name: 'Brand 2', active: false },
          );
          const fn = async () =>
            brandRepo.insert(brandRepo.create({ active: true }));
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: brands.name`,
          );
        });

        it(`should not insert when name is null`, async () => {
          await insertBrands(
            { name: 'Brand 1', active: true },
            { name: 'Brand 2', active: false },
          );
          const fn = async () =>
            brandRepo.insert(brandRepo.create({ name: null, active: true }));
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: brands.name`,
          );
        });

        it(`should not insert when name is undefined`, async () => {
          await insertBrands(
            { name: 'Brand 1', active: true },
            { name: 'Brand 2', active: false },
          );
          const fn = async () =>
            await brandRepo.insert(
              brandRepo.create({ name: undefined, active: true }),
            );
          await expect(fn).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: brands.name`,
          );
        });
      });

      describe('active', () => {
        it('should set active as false by default', async () => {
          await brandRepo.insert(brandRepo.create({ name: 'Brand 1' }));
          const brand = await brandRepo
            .createQueryBuilder(BrandConstants.BRAND)
            .getOne();
          expect(brand.active).toEqual(false);
        });
      });
    });
  });

  describe('find many', () => {
    it('should find many brands', async () => {
      await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );

      const brands = await brandRepo.find();
      expect(Array.isArray(brands)).toBe(true);
      expect(brands).toHaveLength(3);

      validateBrands(
        [
          { name: 'Brand 1', active: true },
          { name: 'Brand 2', active: false },
          { name: 'Brand 3', active: false },
        ],
        brands,
      );
    });
  });

  describe('find one', () => {
    it('should find one brand by id', async () => {
      const [brandId1, brandId2, brandId3] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const brand = await brandRepo.findOne({ where: { id: brandId2 } });
      validateBrand({ name: 'Brand 2', active: false }, brand);
    });
  });

  describe('soft delete', () => {
    it('should soft delete a brand', async () => {
      const [brandId1, brandId2, brandId3] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const allExpectedResults = [
        { id: brandId1, name: 'Brand 1', active: true },
        { id: brandId2, name: 'Brand 2', active: false, deleted: true },
        { id: brandId3, name: 'Brand 3', active: false },
      ];
      const expectedResults = [allExpectedResults[0], allExpectedResults[2]];
      const deleteReturn = await brandRepo.softDelete(brandId2);
      expect(deleteReturn?.affected).toEqual(1);
      const brands = await brandRepo.find();
      validateBrands(expectedResults, brands);
      const allBrands = await brandRepo.find({ withDeleted: true });
      validateBrands(allExpectedResults, allBrands);
    });
  });

  describe('update', () => {
    it('should update an brand', async () => {
      const [brandId1, brandId2, brandId3] = await insertBrands(
        { name: 'Brand 1', active: true },
        { name: 'Brand 2', active: false },
        { name: 'Brand 3' },
      );
      const updateData = { name: 'Brand 2 a', active: true };
      await brandRepo.update(brandId2, updateData);
      const brands = await brandRepo.find();
      validateBrands(
        [
          { name: 'Brand 1', active: true },
          { name: 'Brand 2 a', active: true },
          { name: 'Brand 3', active: false },
        ],
        brands,
      );
    });

    describe('properties', () => {
      describe('name', () => {
        it('should update when name is not defined', async () => {
          const [brandId1, brandId2, brandId3] = await insertBrands(
            { name: 'Brand 1', active: true },
            { name: 'Brand 2', active: false },
            { name: 'Brand 3' },
          );
          const fn = () => brandRepo.update(brandId2, { active: true });
          await expect(fn()).resolves.toEqual({
            affected: 1,
            generatedMaps: [],
            raw: [],
          });
          const brands = await brandRepo.find();
          validateBrands(
            [
              { name: 'Brand 1', active: true },
              { name: 'Brand 2', active: true },
              { name: 'Brand 3', active: false },
            ],
            brands,
          );
        });

        it('should reject update when name is null', async () => {
          const [brandId1, brandId2, brandId3] = await insertBrands(
            { name: 'Brand 1', active: true },
            { name: 'Brand 2', active: false },
            { name: 'Brand 3' },
          );
          const fn = () =>
            brandRepo.update(brandId2, brandRepo.create({ name: null }));
          await expect(fn()).rejects.toThrow(QueryFailedError);
          await expect(fn).rejects.toThrow(
            `SQLITE_CONSTRAINT: NOT NULL constraint failed: brands.name`,
          );
        });

        // TODO: allow undefined???
      });

      describe.skip('active', () => {
        it.skip('should update active', async () => {});
      });
    });
  });
});
