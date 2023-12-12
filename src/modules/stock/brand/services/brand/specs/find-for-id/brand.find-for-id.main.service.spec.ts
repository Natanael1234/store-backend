import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
  testValidateBrand,
  testValidateBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import { ActiveFilter } from '../../../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { BrandConstants } from '../../../../constants/brand/brand-entity.constants';
import { Brand } from '../../../../models/brand/brand.entity';
import { BrandService } from '../../brand.service';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

describe('BrandService.findForId (main)', () => {
  let brandService: BrandService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));

    brandService = module.get<BrandService>(BrandService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should be defined', () => {
    expect(brandService).toBeDefined();
  });

  it('should find brand for id', async () => {
    const [brandId1, brandId2, brandId3] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3' },
    );
    const response = await brandService.findById(brandId2);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true },
      { name: 'Brand 3', active: false },
    ]);
    testValidateBrand(response, { name: 'Brand 2', active: true });
  });

  it('should reject with multiple errors', async () => {
    const [brandId1] = await insertBrands({ name: 'Brand 1', active: true });
    const fn = () =>
      brandService.findById(brandId1, {
        active: 1 as unknown as ActiveFilter,
        deleted: 'invalid' as unknown as DeletedFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [{ name: 'Brand 1', active: true }]);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          active: ActiveMessage.INVALID,
          deleted: DeletedMessage.INVALID,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
