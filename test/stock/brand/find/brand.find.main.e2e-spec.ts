import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConfigs } from '../../../../src/modules/stock/brand/configs/brand/brand.configs';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandOrder } from '../../../../src/modules/stock/brand/enums/brand-order/brand-order.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { PaginationConfigs } from '../../../../src/modules/system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../src/modules/system/constants/sort/sort.constants';
import { ActiveFilter } from '../../../../src/modules/system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { TextMessageOLD } from '../../../../src/modules/system/messages/text-old/text.messages.enum';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../src/test/brand/test-brand-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ActiveMessage = new BoolMessage('active');
const DeletedMessage = new BoolMessage('deleted');

function buildBrandData(quantity: number, startNumber?: number) {
  if (startNumber == null) startNumber = 1;
  return Array.from(Array(quantity), (x, idx) => ({
    name: `Brand ${startNumber + idx}`,
    active: true,
  }));
}

describe('BrandController (e2e) - get /brands (main)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();

    // app.setGlobalPrefix('api');
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    rootToken = (await testBuildAuthenticationScenario(module)).rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should find brands with findDto with parameters', async () => {
    await insertBrands(
      { name: 'Brand 1', active: false },
      { name: 'Brand 1', active: true },
      { name: 'Brand 1', active: false, deletedAt: new Date() },
      { name: 'Brand 1', active: true, deletedAt: new Date() },

      { name: 'Brand 1 b', active: false },
      { name: 'Brand 1 b', active: true },
      { name: 'Brand 1 b', active: false, deletedAt: new Date() }, // result
      { name: 'Brand 1 b', active: true, deletedAt: new Date() }, // result

      { name: 'Brand 2', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false, deletedAt: new Date() },
      { name: 'Brand 2', active: true, deletedAt: new Date() },

      { name: 'Brand 2', active: false },
      { name: 'Brand 2', active: true },
      { name: 'Brand 2', active: false, deletedAt: new Date() },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const registers = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_NAME_LIKE_TEXT_QUERY, {
        textQuery: '%and%1%b%',
      })
      .andWhere(BrandConstants.BRAND_DELETED_AT_IS_NOT_NULL)
      .orderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_NAME, SortConstants.DESC)
      .withDeleted()
      .take(3)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          textQuery: 'and  1  b ',
          active: ActiveFilter.ALL,
          deleted: DeletedFilter.DELETED,
          orderBy: [BrandOrder.ACTIVE_ASC, BrandOrder.NAME_DESC],
          page: 1,
          pageSize: 3,
        }),
      },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: 'and 1 b',
      count: 2,
      page: 1,
      pageSize: 3,
      orderBy: [BrandOrder.ACTIVE_ASC, BrandOrder.NAME_DESC],
      results: objectToJSON(registers),
    });
  });

  it('should find brands with empty findDto', async () => {
    const brandData: any = buildBrandData(15);
    brandData[3].active = false;
    brandData[5].deletedAt = new Date();
    const [brandId1, brandId2] = await insertBrands(...brandData);
    const regs = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .where(BrandConstants.BRAND_ACTIVE_EQUALS_TO, { active: true })
      .skip(0)
      .take(PaginationConfigs.DEFAULT_PAGE_SIZE)
      .orderBy(BrandConstants.BRAND_NAME, SortConstants.ASC)
      .addOrderBy(BrandConstants.BRAND_ACTIVE, SortConstants.ASC)
      .getMany();
    const response = await testGetMin(
      app,
      '/brands',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 13,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: objectToJSON(regs),
    });
  });

  it('should return empty list', async () => {
    const response = await testGetMin(
      app,
      '/brands',
      { query: '{}' },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toEqual({
      textQuery: undefined,
      count: 0,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: BrandConfigs.BRAND_DEFAULT_ORDER_BY,
      results: [],
    });
  });

  it('should reject when data contains multiple errors', async () => {
    const insertData = new Array(15)
      .filter(() => {})
      .map((i) => {
        return { name: `Brand ${i + 1}`, active: true };
      });
    const [brandId1, brandId2] = await insertBrands(...insertData);
    const response = await testGetMin(
      app,
      '/brands',
      {
        query: JSON.stringify({
          active: 'invalid_asc',
          deleted: 'invalid_desc',
          textQuery: true,
          page: '1',
          pageSize: true,
          orderBy: true,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: {
        active: ActiveMessage.INVALID,
        deleted: DeletedMessage.INVALID,
        textQuery: TextMessageOLD.INVALID,
      },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });
});
