import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { BrandConstants } from '../../../../src/modules/stock/brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../../src/modules/stock/brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { DeletedFilter } from '../../../../src/modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../src/modules/system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import {
  TestBrandInsertParams,
  testInsertBrands,
  testValidateBrand,
  testValidateBrands,
} from '../../../../src/test/brand/test-brand-utils';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const DeletedFilterMessage = new BoolMessage('deleted');

describe('BrandController (e2e) - get/:brandId /brands  (query.deleted)', () => {
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

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  it('should find brand when query.delete filter is not_deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true, deleted: false },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
      deleted: false,
    });
  });

  it('should find brand when query.deleted filter is deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: true,
      deleted: true,
    });
  });

  it('should find brand when query.deleted filter is all', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: true,
      deleted: true,
    });
  });

  it('should find not deleted brands when users is root', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
      deleted: false,
    });
  });

  it('should find deleted brands when users is root', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: true,
      deleted: true,
    });
  });

  it('should find not deleted brands when users is admin', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      adminToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
      deleted: false,
    });
  });

  it('should find deleted brands when users is basic user', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      adminToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId2,
      name: 'Brand 2',
      active: true,
      deleted: true,
    });
  });

  it('should find not deleted brands when users is basic user', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      userToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
      deleted: false,
    });
  });

  it('should find not deleted brands when users is not authenticated', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.ALL }) },
      null,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
      deleted: false,
    });
  });

  it('should find brand when query.deleted filter is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: null }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when query.deleted filter is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: undefined }) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should find brand when query.deleted filter not defined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
    testValidateBrand(response, {
      id: brandId1,
      name: 'Brand 1',
      active: true,
    });
  });

  it('should not find brand when query.deleted filter is not_deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.NOT_DELETED }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when query.deleted filter is deleted', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );

    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    await expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find deletes brand when user is basic user', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );

    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      userToken,
      HttpStatus.NOT_FOUND,
    );
    await expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find deleted brand when user is not authenticated', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );

    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: DeletedFilter.DELETED }) },
      null,
      HttpStatus.NOT_FOUND,
    );
    await expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when query.deleted filter is null', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: null }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when query.deleted filter is undefined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({ deleted: undefined }) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should not find brand when query.deleted filter is not defined', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.NOT_FOUND,
    );
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: BrandMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when query.deleted filter is number', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({
          deleted: 1 as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when query.deleted filter is boolean', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({
          deleted: true as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when query.deleted filter is invalid string', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({
          deleted: 'invalid' as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when query.deleted filter is array', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({
          deleted: [] as unknown as DeletedFilter.NOT_DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });

  it('should reject when query.deleted filter is object', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    );
    const response = await testGetMin(
      app,
      `/brands/${brandId1}`,
      {
        query: JSON.stringify({
          deleted: {} as unknown as DeletedFilter.DELETED,
        }),
      },
      rootToken,
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    expect(response).toEqual({
      error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
      message: { deleted: DeletedFilterMessage.INVALID },
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
    const brands = await brandRepo
      .createQueryBuilder(BrandConstants.BRAND)
      .withDeleted()
      .orderBy(BrandConstants.BRAND_NAME)
      .getMany();
    testValidateBrands(brands, [
      { id: brandId1, name: 'Brand 1', active: true },
      { id: brandId2, name: 'Brand 2', active: true, deleted: true },
    ]);
  });
});
