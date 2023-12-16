import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { testInsertBrands } from '../../../../src/test/brand/test-brand-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('BrandController (e2e) - get/:brandId /brands (deleted)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let rootToken: string;
  let adminToken: string;
  let userToken: string;

  beforeEach(async () => {
    module = await getTestingModule();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        stopAtFirstError: true,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      }),
    );
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    await app.init();
    const tokens = await testBuildAuthenticationScenario(module);
    userToken = tokens.userToken;
    adminToken = tokens.adminToken;
    rootToken = tokens.rootToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  async function findBrands() {
    return objectToJSON(
      await brandRepo
        .createQueryBuilder(BrandConstants.BRAND)
        .withDeleted()
        .orderBy(BrandConstants.BRAND_NAME)
        .getMany(),
    );
  }

  it('should find not deleted brand when user is root', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await findBrands();
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
    expect(response).toEqual(brandsBefore[0]);
  });

  it('should find not deleted brand when user is admin', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    const brands = await findBrands();
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
    expect(response).toEqual(brandsBefore[0]);
  });

  it('should find not deleted brand when user is basic user', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.OK,
    );
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
    expect(response).toEqual(brandsBefore[0]);
  });

  it('should find not deleted brand when user is not authenticated', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.OK,
    );
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
    expect(response).toEqual(brandsBefore[0]);
  });

  it('should find deleted brand when user is root', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
    expect(response).toEqual(brandsBefore[1]);
  });

  it('should find deleted brand when user is admin', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
    expect(response).toEqual(brandsBefore[1]);
  });

  it('should not find deleted brand when user is basic user', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
  });

  it('should not find deleted brand when user is not authenticated', async () => {
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    const brandsBefore = await findBrands();
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brandsAfter = await findBrands();
    expect(brandsAfter).toEqual(brandsBefore);
  });
});
