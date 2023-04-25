import {
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { TestBrandData } from '../../../../test/test-brand-data';
import { testValidateBrand } from '../../../../test/test-brand-utils';
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
        await brandService.createBrand(creatBrandDtos[0]),
        await brandService.createBrand(creatBrandDtos[1]),
        await brandService.createBrand(creatBrandDtos[2]),
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
      ...TestBrandData.getNameErrorDataList('create'),
      ...TestBrandData.getActiveErrorDataList(),
    ])(
      '$property',
      ({ data, ExceptionClass, response, property, description }) => {
        it(`should fail when ${property} is ${description}`, async () => {
          const brandDto = plainToInstance(CreateBrandRequestDTO, data);
          const fn = () => brandService.createBrand(brandDto);
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
      ...TestBrandData.getNameAcceptableValues('create'),
      ...TestBrandData.getActiveAcceptableValues(),
    ])('$property', ({ property, data, description }) => {
      it(`should validate when ${property} is ${description}`, async () => {
        const brandDto = plainToInstance(CreateBrandRequestDTO, data);
        const expectedResult = { id: 1, ...data, active: brandDto.active };
        const createdBrand = await brandService.createBrand(brandDto);
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

      const updatedBrand = await brandService.updateBrand(2, brandDto);

      testValidateBrand(updatedBrand, expectedResults[1]);

      const brandsAfter = await brandRepo.find();
      expect(brandsAfter).toHaveLength(3);
      testValidateBrand(brandsAfter[0], expectedResults[0]);
      testValidateBrand(brandsAfter[1], expectedResults[1]);
      testValidateBrand(brandsAfter[2], expectedResults[2]);
    });

    describe.each([
      ...TestBrandData.getNameErrorDataList('update'),
      ...TestBrandData.getActiveErrorDataList(),
    ])(
      '$property',
      ({ description, data, ExceptionClass, response, property }) => {
        it(`should fail when ${property} is ${description}`, async () => {
          const brandData = TestBrandData.dataForRepository;

          await brandRepo.insert(brandData[0]);
          await brandRepo.insert(brandData[1]);

          const brandDto = plainToInstance(UpdateBrandRequestDTO, data);

          const brandsBefore = await brandRepo.find();
          const fn = () => brandService.updateBrand(2, brandDto);
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
      ...TestBrandData.getNameAcceptableValues('update'),
      ...TestBrandData.getActiveAcceptableValues(),
    ])('$property', ({ description, property, data }) => {
      it(`should validate when ${property} is ${description}`, async () => {
        const brandData = TestBrandData.dataForRepository;
        await brandRepo.insert(brandData[0]);
        await brandRepo.insert(brandData[1]);
        await brandRepo.insert(brandData[2]);
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

        const updatedBrand = await brandService.updateBrand(2, brandUpdateDTO);

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
    it('should find brands', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);
      const brandsBefore = await brandRepo.find();

      const serviceBrands = await brandService.findBrands();

      const brandsAfter = await brandRepo.find();
      expect(brandsAfter).toStrictEqual(brandsBefore);
      testValidateBrand(serviceBrands[0], brandsBefore[0]);
      testValidateBrand(serviceBrands[1], brandsBefore[1]);
      testValidateBrand(serviceBrands[2], brandsBefore[2]);
    });

    it('should return empty list', async () => {
      const brandsBefore = await brandRepo.find();
      const serviceBrands = await brandService.findBrands();
      const brandsAfter = await brandRepo.find();

      expect(brandsBefore).toHaveLength(0);
      expect(serviceBrands).toHaveLength(0);
      expect(brandsAfter).toHaveLength(0);
    });
  });

  describe('findForId', () => {
    it('should find brand for id', async () => {
      const brandData = TestBrandData.dataForRepository;

      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);

      const brandsBefore = await brandRepo.find();
      const serviceBrand = await brandService.findBrand(2);
      const brandsAfter = await brandRepo.find();

      expect(brandsAfter).toStrictEqual(brandsBefore);
      testValidateBrand(serviceBrand, brandsBefore[1]);
    });

    it('should fail when brandId is not defined', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.findBrand(null);
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
      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.findBrand(200);
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

      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);

      const brandsBefore = await brandRepo.find();
      const serviceBrand = await brandService.deleteBrand(2);
      const brandsAfter = await brandRepo.find();

      expect(brandsAfter).toStrictEqual([brandsBefore[0], brandsBefore[2]]);
      const allBrandsAfter = await brandRepo.find({ withDeleted: true });
      expect(allBrandsAfter.map((brand) => brand.id)).toEqual([1, 2, 3]);
    });

    it('should fail when brandId is not defined', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.deleteBrand(null);
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
      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.deleteBrand(200);
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

  describe('search', () => {
    it('should textual search brands', async () => {
      const brandData = TestBrandData.dataForRepository;

      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);

      const brandsBefore = await brandRepo.find();
      const search1 = await brandService.searchBrands('rand 1');
      const brandsAfter = await brandRepo.find();
      const search2 = await brandService.searchBrands('Brand');

      expect(brandsBefore).toStrictEqual(brandsAfter);
      expect(search1).toStrictEqual([brandsBefore[0]]);
      expect(search2).toStrictEqual(brandsBefore);
    });

    it('should textual search brands with empty results', async () => {
      const brandData = TestBrandData.dataForRepository;

      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);

      const brandsBefore = await brandRepo.find();
      const search = await brandService.searchBrands('not found text');
      const brandsAfter = await brandRepo.find();

      expect(brandsBefore).toStrictEqual(brandsAfter);
      expect(search).toHaveLength(0);
    });

    it('should fail when parameter is not defined', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.searchBrands({} as string);
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await brandRepo.find()).toStrictEqual(brandsBefore);
      await expect(fn()).rejects.toThrow('Search must be string');
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: 'Search must be string',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });

    it('should fail when parameter is empty string', async () => {
      const brandData = TestBrandData.dataForRepository;
      await brandRepo.insert(brandData[0]);
      await brandRepo.insert(brandData[1]);
      await brandRepo.insert(brandData[2]);
      const brandsBefore = await brandRepo.find();

      const fn = () => brandService.searchBrands('');
      await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      expect(await brandRepo.find()).toStrictEqual(brandsBefore);
      await expect(fn()).rejects.toThrow('Search is empty');
      try {
        await fn();
      } catch (ex) {
        expect(ex.response).toEqual({
          error: 'Unprocessable Entity',
          message: 'Search is empty',
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        });
      }
    });
  });
});
