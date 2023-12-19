import { HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {} from '../../../../../../../../test/common/instance-to-json';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertBrands } from '../../../../../../../test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../../../../test/category/test-category-utils';
import { testInsertProducts } from '../../../../../../../test/product/test-product-utils';
import { PaginationConfigs } from '../../../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../../../system/constants/sort/sort.constants';
import { DeletedFilter } from '../../../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { BoolMessage } from '../../../../../../system/messages/bool/bool.messages';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConfigs } from '../../../../configs/product/product.configs';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

// TODO: mensagem do tipo boolean. Mas recebe uma enum. Corrigir
const DeletedBrandMessage = new BoolMessage('deleted brands');

describe('ProductService.find (deletedBrands)', () => {
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

  async function createTestScenario() {
    const [categoryId1] = await testInsertCategories(categoryRepo, [
      { name: 'Category 1', active: true },
    ]);
    const [brandId1, brandId2] = await testInsertBrands(brandRepo, [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: true, deletedAt: new Date() },
    ]);
    await testInsertProducts(productRepo, [
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
        categoryId: categoryId1,
        brandId: brandId2,
      },
    ]);
  }

  async function findAllProducts() {
    return await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .withDeleted()
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGE,
      )
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }

  async function findNotDeletedBrandsProducts() {
    return await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGE,
      )
      .where(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
        isActiveProduct: true,
      })
      .andWhere(ProductConstants.BRAND_ACTIVE_EQUALS_TO, {
        isActiveBrand: true,
      })
      .andWhere(ProductConstants.BRAND_DELETED_AT_IS_NULL)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }

  async function findDeletedBrandsProducts() {
    return await productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .withDeleted()
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
      .where(ProductConstants.BRAND_DELETED_AT_IS_NOT_NULL)
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC)
      .addOrderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getMany();
  }

  it('should filter products by not deleted brands when deletedBrands = "not_deleted"', async () => {
    await createTestScenario();
    const products = await findNotDeletedBrandsProducts();
    const response = await productService.find({
      deletedBrands: DeletedFilter.NOT_DELETED,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by deleted brands when deletedBrands = "deleted"', async () => {
    await createTestScenario();
    const products = await findDeletedBrandsProducts();
    const response = await productService.find({
      deletedBrands: DeletedFilter.DELETED,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should not filter products by when deletedBrands = "all"', async () => {
    await createTestScenario();
    const products = await findAllProducts();
    const response = await productService.find({
      deletedBrands: DeletedFilter.ALL,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 2,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by not deleted brands when deletedBrands = null', async () => {
    await createTestScenario();
    const products = await findNotDeletedBrandsProducts();
    const response = await productService.find({
      deletedBrands: null,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by not deleted brands when deletedBrands = undefined', async () => {
    await createTestScenario();
    const products = await findNotDeletedBrandsProducts();
    const response = await productService.find({
      deletedBrands: undefined,
    });
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by not deleted brands when deletedBrands is not defined', async () => {
    await createTestScenario();
    const products = await findNotDeletedBrandsProducts();
    const response = await productService.find({});
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by not deleted brands when findDto = null', async () => {
    await createTestScenario();
    const products = await findNotDeletedBrandsProducts();
    const response = await productService.find(null);
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by not deleted brands when findDto = undefined', async () => {
    await createTestScenario();
    const products = await findNotDeletedBrandsProducts();
    const response = await productService.find(undefined);
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should filter products by not deleted brands when findDto is not defined', async () => {
    await createTestScenario();
    const products = await findNotDeletedBrandsProducts();
    const response = await productService.find();
    expect(response).toEqual({
      textQuery: undefined,
      count: 1,
      page: PaginationConfigs.DEFAULT_PAGE,
      pageSize: PaginationConfigs.DEFAULT_PAGE_SIZE,
      orderBy: ProductConfigs.PRODUCT_DEFAULT_ORDER_BY,
      results: products,
    });
  });

  it('should reject when deletedBrands is number', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({
        deletedBrands: 1 as unknown as DeletedFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deletedBrands: DeletedBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deletedBrands is boolean', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({
        deletedBrands: true as unknown as DeletedFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deletedBrands: DeletedBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deletedBrands is invalid string', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({
        deletedBrands: 'invalid' as unknown as DeletedFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deletedBrands: DeletedBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deletedBrands is invalid string', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({
        deletedBrands: 'invalid' as unknown as DeletedFilter,
      });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deletedBrands: DeletedBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deletedBrands is object', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({ deletedBrands: {} as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deletedBrands: DeletedBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });

  it('should reject when deletedBrands is array', async () => {
    await createTestScenario();
    const fn = () =>
      productService.find({ deletedBrands: [] as unknown as DeletedFilter });
    await expect(fn()).rejects.toThrow(UnprocessableEntityException);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
        message: { deletedBrands: DeletedBrandMessage.INVALID },
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
    }
  });
});
