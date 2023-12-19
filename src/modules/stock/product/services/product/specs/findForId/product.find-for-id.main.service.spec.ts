import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../../.jest/test-config.module';
import { testInsertBrands } from '../../../../../../../test/brand/test-brand-utils';
import { testInsertCategories } from '../../../../../../../test/category/test-category-utils';
import { testInsertProductImages } from '../../../../../../../test/product-image/test-product-image-utils';
import { testInsertProducts } from '../../../../../../../test/product/test-product-utils';
import { UuidMessage } from '../../../../../../system/messages/uuid/uuid.messages';
import { Brand } from '../../../../../brand/models/brand/brand.entity';
import { CategoryRepository } from '../../../../../category/repositories/category.repository';
import { ProductImage } from '../../../../../product-image/models/product-image/product-image.entity';
import { ProductImageService } from '../../../../../product-image/services/product-image/product-image.service';
import { ProductConstants } from '../../../../constants/product/product-entity.constants';
import { Product } from '../../../../models/product/product.entity';
import { ProductService } from '../../product.service';

const ProductIdMessage = new UuidMessage('product id');

describe('ProductService.findForId (main)', () => {
  let module: TestingModule;
  let brandRepo: Repository<Brand>;
  let categoryRepo: CategoryRepository;
  let productRepo: Repository<Product>;
  let productImageRepo: Repository<ProductImage>;
  let productService: ProductService;
  let productImageService: ProductImageService;

  beforeEach(async () => {
    module = await getTestingModule();
    brandRepo = module.get<Repository<Brand>>(getRepositoryToken(Brand));
    categoryRepo = module.get<CategoryRepository>(CategoryRepository);
    productRepo = module.get<Repository<Product>>(getRepositoryToken(Product));
    productImageRepo = module.get<Repository<ProductImage>>(
      getRepositoryToken(ProductImage),
    );
    productService = module.get<ProductService>(ProductService);
    productImageService = module.get<ProductImageService>(ProductImageService);
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
      .addOrderBy(ProductConstants.IMAGES_NAME)
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

  it('should be defined', () => {
    expect(productService).toBeDefined();
  });

  it('should find product', async () => {
    const [productId1, productId2, productId3] = await createTestScenario();
    const productsBefore = await getProducts();
    const response = await productService.findById(productId2);
    expect(response).toBeDefined();
    expect(await getProducts()).toEqual(productsBefore);
    expect(response).toEqual(productsBefore[1]);
  });

  describe('find product and its images', () => {
    it('should bring image list together a product', async () => {
      const [productId1, productId2, productId3] = await createTestScenario();
      const [productImageId1, productImageId2, productImageId3] =
        await testInsertProductImages(productImageRepo, [
          {
            name: 'Image 1',
            description: 'Image 1 description',
            image: 'images/image1.jpg',
            thumbnail: 'thumbnails/images/image1.jpg',
            main: true,
            active: true,
            productId: productId1,
          },
          {
            image: 'images/image2.jpg',
            thumbnail: 'thumbnails/images/image2.jpg',
            main: false,
            active: false,
            productId: productId1,
          },
          {
            image: 'images/image3.jpg',
            thumbnail: 'thumbnails/images/image3.jpg',
            main: true,
            active: false,
            productId: productId2,
          },
        ]);
      const expectedProduct = await getProducts();
      const response = await productService.findById(productId1);
      expect(response).toEqual(expectedProduct[0]);
    });

    it('should bring empty image list together a product', async () => {
      const [productId1, productId2, productId3] = await createTestScenario();
      const response = await productService.findById(productId1);
      const expectedProduct = await getProducts();
      expect(response).toEqual(expectedProduct[0]);
    });
  });
});
