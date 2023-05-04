import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindManyOptions, ILike, IsNull, Not, Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestBrandData } from '../../../../test/brand/test-brand-data';
import { testValidateBrand } from '../../../../test/brand/test-brand-utils';
import { AbstractTestServiceActiveFilter } from '../../../../test/filtering/test-service-active-filter';
import { AbstractTestServiceDeletedFilter } from '../../../../test/filtering/test-service-deleted-filter';
import { TestServicePagination } from '../../../../test/filtering/test-service-pagination';
import { AbstractTestServiceTextFilter } from '../../../../test/filtering/test-service-text-filter';
import { TestPurpose } from '../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../test/test-data/test-active-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../../../../test/test-data/test-name-data';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { CreateBrandRequestDTO } from '../../dtos/request/create-brand/create-brand.request.dto';
import { UpdateBrandRequestDTO } from '../../dtos/request/update-brand/update-brand.request.dto';
import { BrandMessage } from '../../enums/brand-messages/brand-messages.enum';
import { BrandEntity } from '../../models/brand/brand.entity';
import { BrandService } from './brand.service';

describe('BrandService', () => {
  let brandService: BrandService;
  let module: TestingModule;
  let brandRepo: Repository<BrandEntity>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<BrandEntity>>(
      getRepositoryToken(BrandEntity),
    );

    brandService = module.get<BrandService>(BrandService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(brandService).toBeDefined();
  });

  describe('create', () => {
    it('should create brand', async () => {
      const brandData = TestBrandData.dataForRepository;

      const creatBrandDtos = [
        plainToInstance(CreateBrandRequestDTO, brandData[0]),
        plainToInstance(CreateBrandRequestDTO, brandData[1]),
        plainToInstance(CreateBrandRequestDTO, brandData[2]),
      ];

      const expectedResults = [
        { id: 1, ...brandData[0] },
        { id: 2, ...brandData[1] },
        { id: 3, ...brandData[2], active: false },
      ];

      const createdBrands = [
        await brandService.create(creatBrandDtos[0]),
        await brandService.create(creatBrandDtos[1]),
        await brandService.create(creatBrandDtos[2]),
      ];

      testValidateBrand(createdBrands[0], expectedResults[0]);
      testValidateBrand(createdBrands[1], expectedResults[1]);
      testValidateBrand(createdBrands[2], expectedResults[2]);

      const brands = await brandRepo.find();
      expect(brands).toHaveLength(3);
      testValidateBrand(brands[0], expectedResults[0]);
      testValidateBrand(brands[1], expectedResults[1]);
      testValidateBrand(brands[2], expectedResults[2]);
    });

    describe.each([
      ...getNameErrorDataList(
        TestBrandData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getActiveErrorDataList(TestBrandData.dataForRepository[1]),
    ])(
      '$property',
      ({ data, ExceptionClass, response, property, description }) => {
        it(`should fail when ${property} is ${description}`, async () => {
          const brandDto = plainToInstance(CreateBrandRequestDTO, data);
          const fn = () => brandService.create(brandDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          expect(await brandRepo.count()).toEqual(0);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        });
      },
    );

    describe.each([
      ...getNameAcceptableValues(
        TestBrandData.dataForRepository[1],
        TestPurpose.create,
      ),
      ...getActiveAcceptableValues(TestBrandData.dataForRepository[1]),
    ])('$property', ({ property, data, description }) => {
      it(`should validate when ${property} is ${description}`, async () => {
        const brandDto = plainToInstance(CreateBrandRequestDTO, data);
        const expectedResult = { id: 1, ...data, active: brandDto.active };
        const createdBrand = await brandService.create(brandDto);
        // expectedResult.active = brandDto.active;
        testValidateBrand(createdBrand, expectedResult);
        const brands = await brandRepo.find();
        expect(brands).toHaveLength(1);
        testValidateBrand(brands[0], expectedResult);
      });
    });
  });

  describe('update', () => {
    it('should update brand', async () => {
      const brandData = TestBrandData.dataForRepository;

      const createdBrands = [
        await brandRepo.insert(brandData[0]),
        await brandRepo.insert(brandData[1]),
        await brandRepo.insert(brandData[2]),
      ];
      const brandsBefore = await brandRepo.find();

      const updateData = { name: 'New Name', active: true };
      const brandDto = plainToInstance(UpdateBrandRequestDTO, updateData);
      const expectedResults = [
        { ...brandsBefore[0] },
        { id: 2, name: updateData.name, active: updateData.active },
        { ...brandsBefore[2] },
      ];

      const updatedBrand = await brandService.update(2, brandDto);

      testValidateBrand(updatedBrand, expectedResults[1]);

      const brandsAfter = await brandRepo.find();
      expect(brandsAfter).toHaveLength(3);
      testValidateBrand(brandsAfter[0], expectedResults[0]);
      testValidateBrand(brandsAfter[1], expectedResults[1]);
      testValidateBrand(brandsAfter[2], expectedResults[2]);
    });

    describe.each([
      ...getNameErrorDataList(
        TestBrandData.dataForRepository[1],
        TestPurpose.update,
      ),
      ...getActiveErrorDataList(TestBrandData.dataForRepository[1]),
    ])(
      '$property',
      ({ description, data, ExceptionClass, response, property }) => {
        it(`should fail when ${property} is ${description}`, async () => {
          const brandData = TestBrandData.dataForRepository;

          await brandRepo.insert(brandData[0]);
          await brandRepo.insert(brandData[1]);

          const brandDto = plainToInstance(UpdateBrandRequestDTO, data);

          const brandsBefore = await brandRepo.find();
          const fn = () => brandService.update(2, brandDto);
          await expect(fn()).rejects.toThrow(ExceptionClass);
          const brandsAfter = await brandRepo.find();
          expect(brandsBefore).toStrictEqual(brandsAfter);
          try {
            await fn();
          } catch (ex) {
            expect(ex.response).toEqual(response);
          }
        });
      },
    );
    describe.each([
      ...getNameAcceptableValues(
        TestBrandData.dataForRepository[1],
        TestPurpose.update,
      ),
      ...getActiveAcceptableValues(TestBrandData.dataForRepository[1]),
    ])('$property', ({ description, property, data }) => {
      it(`should validate when ${property} is ${description}`, async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
        const brandsBefore = await brandRepo.find();
        const expectedBrandResults = [
          { id: 1, ...brandData[0] },
          { id: 2, ...data },
          { id: 3, ...brandData[2] },
        ];
        const brandUpdateDTO = plainToInstance(UpdateBrandRequestDTO, data);
        if (data[property] == null) {
          expectedBrandResults[1][property] = brandsBefore[1][property];
        }
        expectedBrandResults[1].active = brandUpdateDTO.active;

        const updatedBrand = await brandService.update(2, brandUpdateDTO);

        testValidateBrand(updatedBrand, expectedBrandResults[1]);

        const brandsAfter = await brandRepo.find();
        expect(brandsBefore).toHaveLength(3);
        testValidateBrand(brandsAfter[0], expectedBrandResults[0]);
        testValidateBrand(brandsAfter[1], expectedBrandResults[1]);
        testValidateBrand(brandsAfter[2], expectedBrandResults[2]);
      });
    });
  });

  describe('find', () => {
    it('should find brands without parameters and pagination dtos', async () => {
      const brandData: any = TestBrandData.buildData(15);
      brandData[3].active = false;
      brandData[5].deletedAt = new Date();
      await brandRepo.insert(brandData);
      const brands = await brandRepo.find({
        where: { active: true },
        take: 12,
        skip: 0,
      });

      const ret = await brandService.find();

      expect(ret).toEqual({
        count: 13,
        page: 1,
        pageSize: 12,
        results: brands,
      });
    });

    it('should return empty list', async () => {
      const brandsBefore = await brandRepo.find();

      const ret = await brandService.find();

      expect(await brandRepo.find()).toHaveLength(0);
      expect(brandsBefore).toHaveLength(0);
      expect(ret.results).toHaveLength(0);
      expect(ret.count).toEqual(0);
      expect(ret.page).toEqual(1);
      expect(ret.pageSize).toEqual(12);
    });

    describe('filtering', () => {
      it.each([
        { description: 'null', data: null },
        { description: 'undefined', data: undefined },
      ])(
        'should use default values when "filtering" is $description',
        async ({ data }) => {
          const brandData = TestBrandData.buildData(3);
          brandData[2].active = false;
          await brandRepo.insert(brandData);
          const brands = await brandRepo.find();

          const results = await brandService.find(data);

          expect(results).toEqual({
            count: 2,
            page: 1,
            pageSize: 12,
            query: undefined,
            results: [brands[0], brands[1]],
          });
        },
      );

      describe('query', () => {
        class TestServiceTextFilter extends AbstractTestServiceTextFilter<BrandEntity> {
          async insertViaRepository(texts: string[]) {
            const brandsData: any = TestBrandData.buildData(texts.length);
            for (let i = 0; i < brandsData.length; i++) {
              brandsData[i].name = texts[i];
            }
            await brandRepo.insert(brandsData);
          }

          findViaRepository(findManyOptions: FindManyOptions<any>) {
            return brandRepo.findAndCount(findManyOptions);
          }

          findViaService(options?: { query?: string }) {
            return brandService.find(options);
          }
        }

        new TestServiceTextFilter().executeTests();
      });

      describe('active', () => {
        class TestUserServiceActive extends AbstractTestServiceActiveFilter<BrandEntity> {
          async insertRegisters(active: boolean[]) {
            const insertData: any = await TestBrandData.buildData(
              active.length,
            );
            for (let i = 0; i < active.length; i++) {
              insertData[i].active = active[i];
            }
            await brandRepo.insert(insertData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            return brandRepo.findAndCount(findManyOptions);
          }

          findViaService(options?: { active?: ActiveFilter }) {
            return brandService.find(options, {});
          }
        }

        new TestUserServiceActive().executeTests();
      });

      describe('deleted', () => {
        class TestServiceDeleted extends AbstractTestServiceDeletedFilter<BrandEntity> {
          async insertRegisters(deleted: boolean[]) {
            const insertData: any = await TestBrandData.buildData(
              deleted.length,
            );
            for (let i = 0; i < deleted.length; i++) {
              if (deleted[i]) {
                insertData[i].deletedAt = new Date();
              }
            }

            await brandRepo.insert(insertData);
          }

          findRegisters(findManyOptions: FindManyOptions) {
            return brandRepo.findAndCount(findManyOptions);
          }

          findViaService(options?: { deleted?: DeletedFilter }) {
            return brandService.find(options, {});
          }
        }

        new TestServiceDeleted().executeTests();
      });
    });

    describe('pagination', () => {
      class TestBrandServicePagination extends TestServicePagination<BrandEntity> {
        async insertViaRepository(quantity: number) {
          await brandRepo.insert(TestBrandData.buildData(quantity));
        }

        findViaRepository(findManyOptions: { skip: number; take: number }) {
          return brandRepo.findAndCount(findManyOptions);
        }

        findViaService(pagination?: { page?: number; pageSize?: number }) {
          return brandService.find({}, pagination);
        }
      }

      new TestBrandServicePagination().executeTests();
    });

    describe('combined tests', () => {
      let brandsData; //= TestBrandData.buildData(20);
      beforeEach(async () => {
        brandsData = [];
        let j = 1;
        for (let i = 0; i < 4; i++) {
          for (let activeState of [true, false]) {
            for (let deletedAt of [null, new Date()]) {
              for (let text of ['EVEN', 'ODD']) {
                brandsData.push({
                  name: `Brand ${j++} ${text}`,
                  active: activeState,
                  deletedAt,
                });
              }
            }
          }
        }
        const ret = await brandRepo.save(brandsData);
      });

      async function findAncCountBrands(
        query,
        active: ActiveFilter,
        deleted: DeletedFilter,
        page: number,
        pageSize: number,
      ): Promise<{ results: BrandEntity[]; count: number }> {
        let findManyOptions: any = { where: {} };
        // query
        if (query) {
          findManyOptions.where['name'] = ILike(`%EVEN%`);
        }
        // active
        if (active == ActiveFilter.ACTIVE) {
          findManyOptions.where.active = true;
        } else if (active == ActiveFilter.INACTIVE) {
          findManyOptions.where.active = false;
        }
        // deleted
        if (deleted == DeletedFilter.DELETED) {
          findManyOptions.where.deletedAt = Not(IsNull());
          findManyOptions.withDeleted = true;
        } else if (deleted == DeletedFilter.ALL) {
          findManyOptions.withDeleted = true;
        }
        findManyOptions.take = pageSize;
        findManyOptions.skip = (page - 1) * pageSize;
        const [results, count] = await brandRepo.findAndCount(findManyOptions);
        return { results, count };
      }

      async function testCombinedParameters(options: {
        active: ActiveFilter;
        deleted: DeletedFilter;
        page: number;
        pageSize: number;
      }) {
        const { active, deleted, page, pageSize } = options;
        const query = 'EVEN';
        const filter = `%EVEN%`;
        const { results, count } = await findAncCountBrands(
          filter,
          active,
          deleted,
          page,
          pageSize,
        );
        const ret = await brandService.find(
          { query, active, deleted },
          { page, pageSize },
        );
        expect(ret).toEqual({
          count,
          page,
          pageSize,
          results: results,
        });
      }

      describe.each([
        {
          description: 'active and deleted',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.DELETED,
          pageSize: 3,
        },
        {
          description: 'active and not deleted',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          pageSize: 3,
        },
        {
          description: 'active and deleted or not deleted',
          active: ActiveFilter.ACTIVE,
          deleted: DeletedFilter.ALL,
          pageSize: 6,
        },

        {
          description: 'inactive and deleted',
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.DELETED,
          pageSize: 3,
        },
        {
          description: 'inactive and not deleted',
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.NOT_DELETED,
          pageSize: 3,
        },
        {
          description: 'inactive and deleted or not deleted',
          active: ActiveFilter.INACTIVE,
          deleted: DeletedFilter.ALL,
          pageSize: 6,
        },

        {
          description: 'active or inactive and deleted',
          active: ActiveFilter.ALL,
          deleted: DeletedFilter.DELETED,
          pageSize: 6,
        },
        {
          description: 'active or inactive and not deleted',
          active: ActiveFilter.ALL,
          deleted: DeletedFilter.NOT_DELETED,
          pageSize: 6,
        },
        {
          description: 'active or inactive and deleted or not deleted',
          active: ActiveFilter.ALL,
          deleted: DeletedFilter.ALL,
          pageSize: 12,
        },
      ])(
        'Should do text filtering when brand is $description',
        ({ description, active, deleted, pageSize }) => {
          it(`should get first page when ${description}`, async () => {
            await testCombinedParameters({
              active,
              deleted,
              page: 1,
              pageSize,
            });
          });

          it(`should get second page`, async () => {
            await testCombinedParameters({
              active,
              deleted,
              page: 2,
              pageSize,
            });
          });
        },
      );
    });
  });

  describe('findForId', () => {
    it('should find brand for id', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);

      const brandsBefore = await brandRepo.find();
      const serviceBrand = await brandService.findById(2);
      const brandsAfter = await brandRepo.find();

      expect(brandsAfter).toStrictEqual(brandsBefore);
      testValidateBrand(serviceBrand, brandsBefore[1]);
    });

    it('should fail when brandId is not defined', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.findById(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await brandRepo.find()).toStrictEqual(brandsBefore);
      await expect(fn()).rejects.toThrow(BrandMessage.ID_REQUIRED);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: BrandMessage.ID_REQUIRED,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when brand does not exists', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.findById(200);
      await expect(fn()).rejects.toThrow(NotFoundException);
      expect(await brandRepo.find()).toStrictEqual(brandsBefore);
      await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Not Found',
          message: BrandMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });
  });

  describe('delete', () => {
    it('should update brand', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);

      const brandsBefore = await brandRepo.find();
      const serviceBrand = await brandService.delete(2);
      const brandsAfter = await brandRepo.find();

      expect(brandsAfter).toStrictEqual([brandsBefore[0], brandsBefore[2]]);
      const allBrandsAfter = await brandRepo.find({ withDeleted: true });
      expect(allBrandsAfter.map((brand) => brand.id)).toEqual([1, 2, 3]);
    });

    it('should fail when brandId is not defined', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.delete(null);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await brandRepo.find()).toStrictEqual(brandsBefore);
      await expect(fn()).rejects.toThrow(BrandMessage.ID_REQUIRED);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: BrandMessage.ID_REQUIRED,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when brand does not exists', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert([brandData[0], brandData[1], brandData[2]]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.delete(200);
      await expect(fn()).rejects.toThrow(NotFoundException);
      expect(await brandRepo.find()).toStrictEqual(brandsBefore);
      await expect(fn()).rejects.toThrow(BrandMessage.NOT_FOUND);
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Not Found',
          message: BrandMessage.NOT_FOUND,
          statusCode: HttpStatus.NOT_FOUND,
        });
      }
    });
  });
});
