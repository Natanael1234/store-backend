import { HttpStatus, INestApplication } from '@nestjs/common';
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
import { UuidMessage } from '../../../../src/modules/system/messages/uuid/uuid.messages';
import { ValidationPipe } from '../../../../src/modules/system/pipes/custom-validation.pipe';
import { testInsertBrands } from '../../../../src/test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../src/test/category/test-category-utils';
import { testInsertProducts } from '../../../../src/test/product/test-product-utils';
import { objectToJSON } from '../../../common/instance-to-json';
import {
  testBuildAuthenticationScenario,
  testGetMin,
} from '../../../utils/test-end-to-end.utils';

const ProductIdMessage = new UuidMessage('product id');

describe('ProductService.findForId (productId)', () => {
  let module: TestingModule;
  let app: INestApplication;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let rootToken: string;

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
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

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

  async function createTestScenario() {
    const [brandId1, brandId2, brandId3] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    ]);
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await testInsertCategories(categoryRepo, [
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', parentPosition: 1 },
      ]);
    const [productId1, productId2, productId3] = await testInsertProducts(
      productRepo,
      [
        {
          code: '00000001',
          name: 'Product 1',
          model: 'Model 1',
          price: 50,
          quantityInStock: 5,
          active: true,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        {
          code: '00000002',
          name: 'Product 2',
          model: 'Model 2',
          price: 100,
          quantityInStock: 4,
          active: false,
          brandId: brandId1,
          categoryId: categoryId1,
        },
        {
          code: '00000003',
          name: 'Product 3',
          model: 'Model 3',
          price: 20,
          brandId: brandId2,
          categoryId: categoryId2,
        },
      ],
    );

    return [productId1, productId2, productId3];
  }

  it('should find product', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/${productId2}`,
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.OK,
    );
    expect(response).toBeDefined();
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(objectToJSON(productsBefore[1]));
  });

  it('should reject when productId is invalid', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      '/products/not-a-valid-uuid',
      { query: JSON.stringify({}) },
      rootToken,
      HttpStatus.BAD_REQUEST,
    );
    expect(await getProducts()).toStrictEqual(productsBefore);
    expect(response).toEqual({
      error: ExceptionText.BAD_REQUEST,
      message: ProductIdMessage.INVALID,
      statusCode: HttpStatus.BAD_REQUEST,
    });
  });

  it('should reject when product does not exists', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await testGetMin(
      app,
      `/products/f136f640-90b7-11ed-a2a0-fd911f8f7f38`,
      { query: JSON.stringify({}) },
      rootToken,
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
