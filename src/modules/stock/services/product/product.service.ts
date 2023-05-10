import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { FindManyOptions, ILike, IsNull, Not, Repository } from 'typeorm';
import { PaginationConfig } from '../../../system/dtos/request/pagination/configs/pagination.config';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { validateOrThrowError } from '../../../system/utils/validation';
import { CreateProductRequestDTO } from '../../dtos/request/create-product/create-product.request.dto';
import { FindProductRequestDTO } from '../../dtos/request/find-products/find-products.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/request/update-product/update-product.request.dto';
import { BrandMessage } from '../../enums/messages/brand-messages/brand-messages.enum';
import { ProductMessage } from '../../enums/messages/product-messages/product-messages.enum';
import { ProductOrder } from '../../enums/sort/product-order/product-order.enum';
import { BrandEntity } from '../../models/brand/brand.entity';
import { ProductEntity } from '../../models/product/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(BrandEntity)
    private brandRepo: Repository<BrandEntity>,
    @InjectRepository(ProductEntity)
    private productRepo: Repository<ProductEntity>,
  ) {}

  async create(productDto: CreateProductRequestDTO): Promise<ProductEntity> {
    if (!productDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateOrThrowError(productDto, CreateProductRequestDTO);
    const existentBrand = await this.brandRepo.findOne({
      where: { id: productDto.brandId },
    });
    if (!existentBrand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    delete productDto['id'];
    const product = this.productRepo.create(productDto);
    return this.productRepo.save(product);
  }

  async update(
    productId: number,
    productDto: UpdateProductRequestDTO,
  ): Promise<ProductEntity> {
    if (!productId)
      throw new UnprocessableEntityException(ProductMessage.ID_REQUIRED);
    if (!productDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateOrThrowError(productDto, UpdateProductRequestDTO);
    const existentBrand = await this.brandRepo.findOne({
      where: { id: productDto.brandId },
    });
    if (!existentBrand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    const existentProduct = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!existentProduct) throw new NotFoundException(ProductMessage.NOT_FOUND);
    const product = this.productRepo.create(productDto);
    product.id = productId;
    await this.productRepo.update(productId, product);
    return this.productRepo.findOne({ where: { id: productId } });
  }

  async find(
    findDTO?: FindProductRequestDTO,
  ): Promise<PaginatedResponseDTO<ProductEntity>> {
    findDTO = plainToInstance(FindProductRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindProductRequestDTO);
    let { query, active, deleted, page, pageSize, orderBy } = findDTO;

    const findManyOptions: FindManyOptions = {};
    findManyOptions.where = {};

    // text query
    if (query != null) {
      if (query) {
        findManyOptions.where.name = ILike(`%${query.replace(' ', '%')}%`);
      }
    }

    // active
    if (active == ActiveFilter.ACTIVE) {
      findManyOptions.where.active = true;
    } else if (active == ActiveFilter.INACTIVE) {
      findManyOptions.where.active = false;
    }

    // deleted
    if (deleted == DeletedFilter.DELETED) {
      findManyOptions.where.deletedAt = Not(IsNull());
      findManyOptions.withDeleted = true;
    } else if (deleted == DeletedFilter.ALL) {
      findManyOptions.withDeleted = true;
    }

    // pagination
    page = page || PaginationConfig.DEFAULT_PAGE;
    pageSize = pageSize || PaginationConfig.DEFAULT_PAGE_SIZE;
    findManyOptions.take = pageSize;
    findManyOptions.skip = (page - 1) * pageSize;

    // sort
    orderBy = orderBy || [ProductOrder.NAME_ASC];
    findManyOptions.order = {};
    for (let orderItem of orderBy) {
      const [column, direction] = orderItem.split('_');
      findManyOptions.order[column] = direction;
    }

    findManyOptions.relations = { brand: true };

    const [results, count] = await this.productRepo.findAndCount(
      findManyOptions,
    );
    return new PaginatedResponseDTO(results, count, page, pageSize);
  }

  async findById(productId: number) {
    if (!productId)
      throw new UnprocessableEntityException(ProductMessage.ID_REQUIRED);
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: { brand: true },
    });
    if (!product) throw new NotFoundException(ProductMessage.NOT_FOUND);
    return product;
  }

  async delete(productId: number): Promise<SuccessResponseDto> {
    if (!productId)
      throw new UnprocessableEntityException(ProductMessage.ID_REQUIRED);
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException(ProductMessage.NOT_FOUND);
    await this.productRepo.softDelete(productId);
    return new SuccessResponseDto();
  }
}
