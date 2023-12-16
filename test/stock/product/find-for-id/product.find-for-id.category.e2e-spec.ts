import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../src/.jest/test-config.module';
import { Brand } from '../../../../src/modules/stock/brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../src/modules/stock/category/repositories/category.repository';
import { ProductConstants } from '../../../../src/modules/stock/product/constants/product/product-entity.constants';
import { ProductMessage } from '../../../../src/modules/stock/product/messages/product/product.messages.enum';
import { Product } from '../../../../src/modules/stock/product/models/product/product.entity';
import { ExceptionText } from '../../../../src/modules/system/messages/exception-text/exception-text.enum';
import { testInsertBrands } from '../../../../src/test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../src/test/category/test-category-utils';
import { testInsertProducts } from '../../../../src/test/product/test-product-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

describe('ProductService.findForId (brand)', () => {
  let app: INestApplication;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
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
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    await app.init();
    const tokens = await testBuildAuthenticationScenario(module);
    rootToken = tokens.rootToken;
    adminToken = tokens.adminToken;
    userToken = tokens.userToken;
  });

  afterEach(async () => {
    await app.close();
    await module.close();
  });

  async function createTestScenario() {
    const [categoryId1, categoryId2] = await testInsertCategories(
      categoryRepo,
      [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: false },
      ],
    );
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
    ]);
    const products = await testInsertProducts(productRepo, [
      {
        code: 'C001',
        name: 'Product 1',
        model: 'M0001',
        price: 9.12,
        quantityInStock: 3,
        active: true,
        categoryId: categoryId1,
        brandId: brandId1,
      },
      {
        code: 'C002',
        name: 'Product 2',
        model: 'M0002',
        price: 500,
        quantityInStock: 9,
        active: true,
        categoryId: categoryId2,
        brandId: brandId1,
      },
    ]);
    return products;
  }

  async function getProducts() {
    return productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGES,
      )
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME)
      .getMany();
  }

  it('should find product with active category when user is root', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId1}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(objectToJSON(productsBefore[0]));
  });

  it('should find product with active category when user is admin', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId1}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(objectToJSON(productsBefore[0]));
  });

  it('should find product with active category when user is basic user', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId1}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.OK,
    );
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(objectToJSON(productsBefore[0]));
  });

  it('should find product with active category when user is not authenticated', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId1}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.OK,
    );
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(objectToJSON(productsBefore[0]));
  });

  it('should find product with inactive category when user is root', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(objectToJSON(productsBefore[1]));
  });

  it('should find product with inactive category when user is admin', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId2}`,
      { query: JSON.stringify({}) },
      adminToken,
      HttpStatus.OK,
    );
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(objectToJSON(productsBefore[1]));
  });

  it('should not find active product with inactive category when user is basic user', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId2}`,
      { query: JSON.stringify({}) },
      userToken,
      HttpStatus.NOT_FOUND,
    );
    expect(await getProducts()).toStrictEqual(productsBefore);
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: ProductMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it('should not find active product with inactive category when user is not authenticated', async () => {
    const [productId1, productId2] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId2}`,
      { query: JSON.stringify({}) },
      null,
      HttpStatus.NOT_FOUND,
    );
    expect(await getProducts()).toStrictEqual(productsBefore);
    expect(response).toEqual({
      error: ExceptionText.NOT_FOUND,
      message: ProductMessage.NOT_FOUND,
      statusCode: HttpStatus.NOT_FOUND,
    });
  });
});
