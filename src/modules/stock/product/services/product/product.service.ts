import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { PaginationConfigs } from '../../../../system/configs/pagination/pagination.configs';
import { SortConstants } from '../../../../system/constants/sort/sort.constants';
import { PaginatedResponseDTO } from '../../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../../system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { isValidUUID } from '../../../../system/utils/validation/uuid/is-valid-uuid-fn';
import { validateOrThrowError } from '../../../../system/utils/validation/validation';
import { BrandConstants } from '../../../brand/constants/brand/brand-entity.constants';
import { BrandMessage } from '../../../brand/messages/brand-messages/brand.messages.enum';
import { Brand } from '../../../brand/models/brand/brand.entity';
import { CategoryConstants } from '../../../category/constants/category/categoryd-entity.constants';
import { CategoryMessage } from '../../../category/messages/category/category.messages.enum';
import { Category } from '../../../category/models/category/category.entity';
import { ProductConstants } from '../../constants/product/product-entity.constants';
import { CreateProductRequestDTO } from '../../dtos/create-product/create-product.request.dto';
import { FindProductsRequestDTO } from '../../dtos/find-products/find-products.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/update-product/update-product.request.dto';
import { ProductOrder } from '../../enums/product-order/product-order.enum';
import { ProductMessage } from '../../messages/product/product.messages.enum';
import { Product } from '../../models/product/product.entity';

const ProductIdMessage = new UuidMessage('product id');

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async create(productDto: CreateProductRequestDTO): Promise<Product> {
    if (!productDto) {
      throw new BadRequestException(ProductMessage.DATA_REQUIRED);
    }
    productDto = plainToInstance(CreateProductRequestDTO, productDto);
    await validateOrThrowError(productDto, CreateProductRequestDTO);

    // brand

    const existentBrand = await this.brandRepo.findOne({
      where: { id: productDto.brandId },
    });
    if (!existentBrand) {
      throw new NotFoundException(BrandMessage.NOT_FOUND);
    }

    // category

    const existendCategory = await this.categoryRepo.findOne({
      where: { id: productDto.categoryId },
    });
    if (!existendCategory) {
      throw new NotFoundException(CategoryMessage.NOT_FOUND);
    }

    // product

    delete productDto['id'];
    const product = this.productRepo.create(productDto);

    await this.productRepo.save(product);

    return await this.productRepo.findOne({
      where: { id: product.id },
      relations: {
        brand: true,
        category: true,
        images: true,
      },
    });
  }

  async update(
    productId: string,
    productDto: UpdateProductRequestDTO,
  ): Promise<Product> {
    this.validateProductId(productId);

    if (!productDto) {
      throw new BadRequestException(ProductMessage.DATA_REQUIRED);
    }
    productDto = plainToInstance(UpdateProductRequestDTO, productDto);
    await validateOrThrowError(productDto, UpdateProductRequestDTO);

    // existent product

    const existentProduct = await this.productRepo
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
      .where(ProductConstants.PRODUCT_ID_EQUALS_TO, { productId })
      .withDeleted()
      .getOne();

    // product not found

    if (!existentProduct) {
      throw new NotFoundException(ProductMessage.NOT_FOUND);
    }

    // code

    if (productDto.code != null) {
      existentProduct.code = productDto.code;
    }

    // name

    if (productDto.name != null) {
      existentProduct.name = productDto.name;
    }

    // model

    if (productDto.model != null) {
      existentProduct.model = productDto.model;
    }

    // price

    if (productDto.price != null) {
      existentProduct.price = productDto.price;
    }

    // quantityInStock

    if (productDto.quantityInStock != null) {
      existentProduct.quantityInStock = productDto.quantityInStock;
    }

    // active

    if (productDto.active !== null) {
      existentProduct.active = productDto.active;
    }

    // brandId

    if (productDto.brandId != undefined) {
      const existentBrand = await this.brandRepo.findOne({
        where: { id: productDto.brandId },
      });
      if (!existentBrand) {
        throw new NotFoundException(BrandMessage.NOT_FOUND);
      }
      existentProduct.brand = existentBrand;
    }

    // categoryId

    if (productDto.categoryId != undefined) {
      const existentCategory = await this.categoryRepo.findOneBy({
        id: productDto.categoryId,
      });
      if (!existentCategory) {
        throw new NotFoundException(CategoryMessage.NOT_FOUND);
      }
      existentProduct.category = existentCategory;
    }

    // update product

    const retUpdate = await this.productRepo.save(existentProduct);

    // get saved product

    const product = await this.productRepo
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
      .where(ProductConstants.PRODUCT_ID_EQUALS_TO, { productId })
      .withDeleted()
      .orderBy(ProductConstants.PRODUCT_NAME, SortConstants.ASC) // TODO: Separation of Concerns
      .orderBy(ProductConstants.PRODUCT_ACTIVE, SortConstants.ASC)
      .getOne();

    return product;
  }

  async find(
    findDTO?: FindProductsRequestDTO,
  ): Promise<PaginatedResponseDTO<Product, ProductOrder>> {
    findDTO = plainToInstance(FindProductsRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindProductsRequestDTO);
    let {
      textQuery,
      brandIds,
      categoryIds,
      active,
      deleted,
      page,
      pageSize,
      orderBy,
    } = findDTO;

    let select = this.productRepo
      .createQueryBuilder(ProductConstants.PRODUCT)
      .leftJoinAndSelect(ProductConstants.PRODUCT_BRAND, ProductConstants.BRAND)
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_CATEGORY,
        ProductConstants.CATEGORY,
      )
      .leftJoinAndSelect(
        ProductConstants.PRODUCT_IMAGES,
        ProductConstants.IMAGE,
        ProductConstants.IMAGE_MAIN_EQUALS_TO,
        { main: true },
      );

    // textQuery by name

    if (textQuery) {
      select = select
        .andWhere(ProductConstants.PRODUCT_NAME_IS_NOT_NULL, {
          textQuery,
        })
        .andWhere(ProductConstants.PRODUCT_NAME_LIKE_TEXT_QUERY, {
          textQuery,
        });
    }

    // active

    if (active == ActiveFilter.ACTIVE) {
      select = select.andWhere(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
        active: true,
      });
    } else if (active == ActiveFilter.INACTIVE) {
      select = select.andWhere(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
        active: false,
      });
    }

    // deletedAt

    if (deleted == DeletedFilter.DELETED) {
      select = select
        .withDeleted()
        .andWhere(ProductConstants.PRODUCT_DELETED_AT_IS_NOT_NULL);
    } else if (deleted == DeletedFilter.ALL) {
      select = select.withDeleted();
    }

    // pagination

    page = page || PaginationConfigs.DEFAULT_PAGE;
    pageSize = pageSize || PaginationConfigs.DEFAULT_PAGE_SIZE;
    select = select.take(pageSize).skip((page - 1) * pageSize);

    // sort

    for (let i = 0; i < orderBy.length; i++) {
      const [column, direction] = orderBy[i].split('_'); // TODO: move to DTO
      if (i == 0) {
        select = select.orderBy(
          `product.${column}`,
          direction.toUpperCase() as 'ASC' | 'DESC',
        );
      } else {
        select = select.addOrderBy(
          `product.${column}`,
          direction.toUpperCase() as 'ASC' | 'DESC',
        );
      }
    }

    // brandId

    if (brandIds?.length) {
      select = select.andWhere(BrandConstants.BRAND_ID_IN, { brandIds });
    }

    // categoryId

    if (categoryIds?.length) {
      select = select.andWhere(CategoryConstants.CATEGORY_ID_IN, {
        categoryIds,
      });
    }

    // results

    const [results, count] = await select.getManyAndCount();

    textQuery = textQuery?.replace(/(^%|%$)/g, '').replace(/%/g, ' ');
    return new PaginatedResponseDTO(
      textQuery,
      count,
      page,
      pageSize,
      orderBy,
      results,
    );
  }

  async findById(productId: string, publicAccess?: boolean) {
    this.validateProductId(productId);
    let select = this.productRepo
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
      .where(ProductConstants.PRODUCT_ID_EQUALS_TO, { productId });
    if (publicAccess === true) {
      select = select.andWhere(ProductConstants.PRODUCT_ACTIVE_EQUALS_TO, {
        active: true,
      });
    } else {
      select = select.withDeleted();
    }
    select = select
      .orderBy(ProductConstants.PRODUCT_NAME)
      .addOrderBy(ProductConstants.IMAGES_NAME);
    const product = await select.getOne();
    if (!product) {
      throw new NotFoundException(ProductMessage.NOT_FOUND);
    }
    return product;
  }

  async delete(productId: string): Promise<SuccessResponseDto> {
    this.validateProductId(productId);

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(ProductMessage.NOT_FOUND);
    }
    await this.productRepo.softDelete(productId);
    const ret = new SuccessResponseDto();
    ret.status = 'success';
    return ret;
  }

  private validateProductId(productId: string) {
    if (!productId)
      throw new UnprocessableEntityException(ProductIdMessage.REQUIRED);
    if (!isValidUUID(productId)) {
      throw new UnprocessableEntityException(ProductIdMessage.INVALID);
    }
  }
}
