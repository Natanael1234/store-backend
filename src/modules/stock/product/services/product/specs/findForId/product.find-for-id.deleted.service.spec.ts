import { HttpStatus, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertBrands } from '../../../../../../../test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../../../../test/category/test-category-utils';
import { testInsertProducts } from '../../../../../../../test/product/test-product-utils';
import { ExceptionText } from '../../../../../../system/messages/exception-text/exception-text.enum';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { ProductMessage } from '../../../../messages/product/product.messages.enum';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

describe('ProductService.findForId (deleted)', () => {
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
    const [brandId1] = await testInsertBrands(brandRepo, [
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
        active: false,
        categoryId: categoryId1,
        brandId: brandId1,
      },
      {
        code: 'C003',
        name: 'Product 3',
        model: 'M0003',
        price: 4000,
        quantityInStock: 1,
        active: true,
        deletedAt: new Date(),
        categoryId: categoryId1,
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

  it('should find not deleted product when publicAccess = true', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId1, true);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[0]);
  });

  it('should find not deleted product when publicAccess = false', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId1, true);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[0]);
  });

  it('should find deleted product when publicAccess = false', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId3, false);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[2]);
  });

  it('should find not deleted product when publicAccess = null', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId1, null);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[0]);
  });

  it('should find deleted product when publicAccess = null', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId3, null);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[2]);
  });

  it('should find not deleted product when publicAccess = undefined', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId1, undefined);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[0]);
  });

  it('should find deleted product when publicAccess = undefined', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId3, undefined);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[2]);
  });

  it('should find not deleted product when publicAccess is not defined', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId1);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[0]);
  });

  it('should find deleted product when publicAccess is not defined', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId3);
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[2]);
  });

  it('should not find deleted product when publicAccess = true', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const fn = () => productService.findById(productId3, true);
    await expect(fn()).rejects.toThrow(NotFoundException);
    await expect(fn()).rejects.toThrow(ProductMessage.NOT_FOUND);
    try {
      await fn();
    } catch (ex) {
      expect(ex.response).toEqual({
        error: ExceptionText.NOT_FOUND,
        message: ProductMessage.NOT_FOUND,
        statusCode: HttpStatus.NOT_FOUND,
      });
    }
    expect(await getProducts()).toEqual(productsBefore);
  });
});
