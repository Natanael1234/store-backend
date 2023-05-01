import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestBrandData } from '../../../../test/test-brand-data';
import { testValidateBrand } from '../../../../test/test-brand-utils';
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
import { PaginationMessage } from '../../../system/enums/messages/pagination-messages/pagination-messages.enum';
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
        it('should do textual filtering matching one result', async () => {
          await brandRepo.insert(TestBrandData.buildData(3));
          const brands = await brandRepo.find();

          const results = await brandService.find({ query: 'nd 1' });

          expect(results.count).toEqual(1);
          expect(results.page).toEqual(1);
          expect(results.pageSize).toEqual(12);
          expect(results.results).toStrictEqual([brands[0]]);
        });

        it('should do textual filtering matching all results', async () => {
          const brandData = TestBrandData.buildData(3);
          await brandRepo.insert(brandData);
          const brands = await brandRepo.find();

          const results = await brandService.find({ query: ' br   nd' });

          expect(results.count).toEqual(3);
          expect(results.page).toEqual(1);
          expect(results.pageSize).toEqual(12);
          expect(results.results).toStrictEqual(brands);
        });

        it('should do textual filtering matching no results', async () => {
          await brandRepo.insert(TestBrandData.buildData(3));

          const ret = await brandService.find({
            query: '  not  found ',
          });

          expect(ret.count).toEqual(0);
          expect(ret.page).toEqual(1);
          expect(ret.pageSize).toEqual(12);
          expect(ret.results).toEqual([]);
        });

        it('should not filter by text when query is empty string', async () => {
          const brandsData = TestBrandData.buildData(3);
          brandsData.forEach((brandData) => (brandData.active = true));
          await brandRepo.insert(brandsData);
          const brands = await brandRepo.find();

          const ret = await brandService.find({ query: '     ' });

          expect(ret.count).toEqual(3);
          expect(ret.page).toEqual(1);
          expect(ret.pageSize).toEqual(12);
          expect(ret.results).toEqual(brands);
        });

        it('should not filter by text when query is string of spaces', async () => {
          const brandsData = TestBrandData.buildData(3);
          brandsData.forEach((brandData) => {
            brandData.active = true;
            brandData.name = brandData.name.replace(' ', '');
          });
          await brandRepo.insert(brandsData);
          const brands = await brandRepo.find();

          const ret = await brandService.find({ query: '' });
          const brandsAfter = await brandRepo.find();

          expect(brands).toStrictEqual(brandsAfter);
          expect(ret.count).toEqual(3);
          expect(ret.results).toHaveLength(3);
        });
      });

      describe('active', () => {
        // active

        it.each([
          { description: 'null', data: { active: null } },
          { description: 'undefined', data: { active: undefined } },
          { description: 'not defined', data: {} },
          {
            description: 'ActiveFilter.ACTIVE',
            data: { active: ActiveFilter.ACTIVE },
          },
        ])(
          'should return only active results when "filtering.active" is $description',
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

        // inactive
        it('should return only inactive results when "filtering.active" is ActiveFilter.INACTIVE', async () => {
          const brandData = TestBrandData.buildData(3);
          brandData[2].active = false;
          await brandRepo.insert(brandData);
          const brands = await brandRepo.find();

          const results = await brandService.find({
            active: ActiveFilter.INACTIVE,
          });

          expect(results).toEqual({
            count: 1,
            page: 1,
            pageSize: 12,
            query: undefined,
            results: [brands[2]],
          });
        });

        // active and inactive
        it('should return active and inactive results when "filtering.active" is ActiveFilter.ALL', async () => {
          const brandData = TestBrandData.buildData(3);
          brandData[2].active = false;
          await brandRepo.insert(brandData);
          const brands = await brandRepo.find({ withDeleted: true });

          const results = await brandService.find({
            active: ActiveFilter.ALL,
          });

          expect(results).toEqual({
            count: 3,
            page: 1,
            pageSize: 12,
            results: brands,
          });
        });
      });

      describe('deleted', () => {
        // deleted
        it('should return only not deleted results when "filtering.deleted" is DeletedFilter.DELETED', async () => {
          const brandData = TestBrandData.buildData(3);
          brandData[2].active = false;
          await brandRepo.insert(brandData);
          await brandRepo.softDelete(2);
          const brands = await brandRepo.find({
            withDeleted: true,
            where: {
              deletedAt: Not(IsNull()),
            },
          });

          const results = await brandService.find({
            deleted: DeletedFilter.DELETED,
          });

          expect(results).toEqual({
            count: 1,
            page: 1,
            pageSize: 12,
            results: brands,
          });
        });

        // not deleted
        it.each([
          { description: 'null', data: { deleted: null } },
          { description: 'undefined', data: { deleted: undefined } },
          { description: 'not defined', data: {} },
          {
            description: 'DeletedFilter.NOT_DELETED',
            data: { deleted: DeletedFilter.NOT_DELETED },
          },
        ])(
          'should return only not deleted results when "filtering.deleted" is $description',
          async ({ data }) => {
            const brandData = TestBrandData.buildData(3);
            brandData[2].active = false;
            await brandRepo.insert(brandData);
            await brandRepo.softDelete(2);
            const brands = await brandRepo.find({ where: { active: true } });

            const results = await brandService.find(data);

            expect(results).toEqual({
              count: 1,
              page: 1,
              pageSize: 12,
              results: brands,
            });
          },
        );

        // deleted and not deleted
        it('should return deleted and not deleted results when "filtering.deleted" is DeletedFilter.ALL', async () => {
          const brandData = TestBrandData.buildData(3);
          brandData[2].active = false;
          await brandRepo.insert(brandData);
          await brandRepo.softDelete(2);
          const brands = await brandRepo.find({
            withDeleted: true,
            where: { active: true },
          });

          const results = await brandService.find({
            deleted: DeletedFilter.ALL,
          });

          expect(results).toEqual({
            count: 2,
            page: 1,
            pageSize: 12,
            results: brands,
          });
        });
      });
    });

    describe('pagination', () => {
      let brandsData;
      let expectedResults;

      beforeEach(async () => {
        brandsData = TestBrandData.buildData(15);
        const brands = await brandRepo.find();
        await brandRepo.insert(brandsData);
        expectedResults = await brandRepo.find();
      });

      async function testPagination(paginationParams?: {
        page?: number;
        pageSize?: number;
      }) {
        // prepare
        const count = brandsData.length;
        let page = paginationParams?.page;
        if (page == null) page = 1;
        if (page < 1) page = 1;

        let pageSize = paginationParams?.pageSize;
        if (pageSize == null) pageSize = 12;
        if (pageSize < 1) pageSize = 1;
        if (pageSize > 40) pageSize = 40;

        const skip = (page - 1) * pageSize;
        const take = pageSize;
        const expectedResultsPage: any[] = expectedResults.slice(
          skip,
          skip + take,
        );

        // execute
        const ret = paginationParams
          ? await brandService.find({}, paginationParams)
          : await brandService.find();

        // test
        expect(ret).toBeDefined();
        expect(ret.count).toEqual(count);
        expect(ret.page).toEqual(page);
        expect(ret.page).toBeGreaterThanOrEqual(1);
        expect(ret.pageSize).toEqual(pageSize);
        expect(ret.pageSize).toBeGreaterThanOrEqual(1);

        expect(ret.results).toHaveLength(expectedResultsPage.length);
        for (let i = 0; i < expectedResultsPage.length; i++) {
          testValidateBrand(ret.results[i], expectedResultsPage[i]);
        }
      }

      it('should paginate serch brands without sending pagination params', async () => {
        await testPagination(null);
      });

      it('should paginate search without sending page and page size', async () => {
        await testPagination({});
      });

      it('should paginate seach without sending page size', async () => {
        await testPagination({ page: 1 });
      });

      it('should paginate search without sending page size and sending page > 1', async () => {
        await testPagination({ page: 2 });
      });

      it('should paginage serch without sending page and sending page size != default page size', async () => {
        await testPagination({ pageSize: 5 });
      });

      it('should paginate search seding page > 1 and page size != page size', async () => {
        await testPagination({ page: 3, pageSize: 5 });
      });

      it('should use page=1 when page parameter = 0', async () => {
        await testPagination({ page: 0, pageSize: 5 });
      });

      it('should use page=1 when page parameter < 0', async () => {
        await testPagination({ page: -1, pageSize: 5 });
      });

      it('should use pageSize=1 when pageSize parameter = 0', async () => {
        await testPagination({ pageSize: 0 });
      });

      it('should use pageSize=1 when pageSize parameter = -1', async () => {
        await testPagination({ pageSize: -1 });
      });

      it('should use pageSize=40 when pageSize parameter = 40', async () => {
        await testPagination({ pageSize: 40 });
      });

      it('should use pageSize=40 when pageSize parameter > 40', async () => {
        await testPagination({ pageSize: 41 });
      });

      it('should fail if page is float', async () => {
        const fn = () => brandService.find({}, { page: 1.1 });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'UnprocessableEntityException',
            message: {
              page: PaginationMessage.PAGE_INT,
            },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });

      it('should fail if page is negative float', async () => {
        const fn = () => brandService.find({}, { page: -1.1 });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        try {
          await fn();
        } catch (ex) {
          expect(ex.response).toEqual({
            error: 'UnprocessableEntityException',
            message: {
              page: PaginationMessage.PAGE_INT,
            },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
      });
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
