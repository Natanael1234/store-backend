import {
  BadRequestException,
  HttpStatus,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import {
  TestBrandInsertParams,
  testInsertBrands,
} from '../../../../../../../test/brand/test-brand-utils';
import {
  TestCategoryInsertParams,
  testInsertCategories,
} from '../../../../../../../test/category/test-category-utils';
import { testValidateProducts } from '../../../../../../../test/product/test-product-utils';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { NumberMessage } from '../../../../../../system/messages/number/number.messages';
import { TextMessage } from '../../../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { ProductMessage } from '../../../../messages/product/product.messages.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const CodeMessage = new TextMessage('code', {
  minLength: ProductConfigs.CODE_MIN_LENGTH,
  maxLength: ProductConfigs.CODE_MAX_LENGTH,
});
const NameMessage = new TextMessage('name', {
  minLength: ProductConfigs.NAME_MIN_LENGTH,
  maxLength: ProductConfigs.NAME_MAX_LENGTH,
});
const ModelMessage = new TextMessage('model', {
  minLength: ProductConfigs.MODEL_MIN_LENGTH,
  maxLength: ProductConfigs.MODEL_MAX_LENGTH,
});
const PriceMessage = new NumberMessage('price', {
  min: ProductConfigs.MIN_PRICE,
  max: ProductConfigs.MAX_PRICE,
});
const QuantityInStockMessage = new NumberMessage('quantity in stock', {
  min: ProductConfigs.MIN_QUANTITY_IN_STOCK,
  max: ProductConfigs.MAX_QUANTITY_IN_STOCK,
});
const ActiveMessage = new BoolMessage('active');
const BrandIdMessage = new UuidMessage('brand id');
const CategoryIdMessage = new UuidMessage('category id');

describe('ProductService.create (main)', () => {
  let productService: ProductService;
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productService = module.get<ProductService>(ProductService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertBrands(
    ...brands: TestBrandInsertParams[]
  ): Promise<string[]> {
    return testInsertBrands(brandRepo, brands);
  }

  async function insertCategories(
    ...categories: TestCategoryInsertParams[]
  ): Promise<string[]> {
    return testInsertCategories(categoryRepo, categories);
  }

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

  it('should create product', async () => {
    const [brandId1, brandId2] = await insertBrands(
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    );
    const [categoryId1, categoryId2, categoryId3, categoryId4] =
      await insertCategories(
        { name: 'Category 1', active: true },
        { name: 'Category 2', active: true, parentPosition: 1 },
        { name: 'Category 3', active: false, parentPosition: 2 },
        { name: 'Category 4', parentPosition: 1 },
      );
    const expectedProducts = [
      {
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 51.45,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100.4,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
        brand: { id: brandId1, name: 'Brand 1', active: true },
        category: { id: categoryId1, name: 'Category 1', active: true },
        images: [],
      },
      {
        code: '00000003',
        name: 'Product 3',
        model: 'Model 3',
        price: 20,
        quantityInStock: 0,
        active: false,
        brandId: brandId2,
        categoryId: categoryId2,
        brand: { id: brandId2, name: 'Brand 2', active: false },
        category: { id: categoryId2, name: 'Category 2', active: true },
        images: [],
      },
    ];
    const createdProducts = [
      await productService.create({
        code: '00000001',
        name: 'Product 1',
        model: 'Model 1',
        price: 51.45,
        quantityInStock: 5,
        active: true,
        brandId: brandId1,
        categoryId: categoryId1,
      }),
      await productService.create({
        code: '00000002',
        name: 'Product 2',
        model: 'Model 2',
        price: 100.4,
        quantityInStock: 4,
        active: false,
        brandId: brandId1,
        categoryId: categoryId1,
      }),
      await productService.create({
        code: '00000003',
        name: 'Product 3',
        model: 'Model 3',
        price: 20,
        quantityInStock: 56,
        brandId: brandId2,
        categoryId: categoryId2,
      }),
    ];
    testValidateProducts(createdProducts, expectedProducts);
    const products = await productRepo
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
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .getMany();
    testValidateProducts(products, expectedProducts);
  });

  it('should fail when productDto is null', async () => {
    const fn = () => productService.create(null);
    await expect(fn()).rejects.toThrow(ProductMessage.DATA_REQUIRED);
    await expect(fn()).rejects.toThrow(BadRequestException);
  });

  it('should fail when productDto is undefined', async () => {
    const fn = () => productService.create(undefined);
    await expect(fn()).rejects.toThrow(ProductMessage.DATA_REQUIRED);
    await expect(fn()).rejects.toThrow(BadRequestException);
  });

  it('should fail with multiple errors', async () => {
    const brandIds = await insertBrands({ name: 'Brand 1', active: true });
    await categoryRepo.bulkCreate([{ name: 'Category 1', active: true }]);
    const data = {
      code: 1 as unknown as string,
      name: 1.1 as unknown as string,
      model: true as unknown as string,
      price: null,
      quantityInStock: 1.1 as unknown as number,
      active: 'true' as unknown as boolean,
      brandId: [] as unknown as string,
      categoryId: {} as unknown as string,
    };
    const fn = () => productService.create(data);
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    expect(await productRepo.count()).toEqual(0);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: {
          code: CodeMessage.INVALID,
          name: NameMessage.INVALID,
          model: ModelMessage.INVALID,
          price: PriceMessage.NULL,
          quantityInStock: QuantityInStockMessage.INT,
          active: ActiveMessage.INVALID,
          brandId: BrandIdMessage.STRING,
          categoryId: CategoryIdMessage.STRING,
        },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
