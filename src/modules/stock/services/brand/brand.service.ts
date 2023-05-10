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
import { CreateBrandRequestDTO } from '../../dtos/request/create-brand/create-brand.request.dto';
import { FindBrandRequestDTO } from '../../dtos/request/find-brands/find-brands.request.dto';
import { UpdateBrandRequestDTO } from '../../dtos/request/update-brand/update-brand.request.dto';
import { BrandMessage } from '../../enums/messages/brand-messages/brand-messages.enum';
import { BrandOrder } from '../../enums/sort/brand-order/brand-order.enum';
import { BrandEntity } from '../../models/brand/brand.entity';

@Injectable()
export class BrandService {
  pageSize = 12;

  constructor(
    @InjectRepository(BrandEntity)
    private brandRepo: Repository<BrandEntity>,
  ) {}

  async create(brandDto: CreateBrandRequestDTO): Promise<BrandEntity> {
    if (!brandDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateOrThrowError(brandDto, CreateBrandRequestDTO);
    delete brandDto['id'];
    const brand = this.brandRepo.create(brandDto);
    return this.brandRepo.save(brand);
  }

  async update(
    brandId: number,
    brandDto: UpdateBrandRequestDTO,
  ): Promise<BrandEntity> {
    if (!brandId)
      throw new UnprocessableEntityException(BrandMessage.ID_REQUIRED);
    if (!brandDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateOrThrowError(brandDto, UpdateBrandRequestDTO);
    const existentBrand = await this.brandRepo.findOne({
      where: { id: brandId },
    });
    if (!existentBrand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    delete brandDto['id'];
    await this.brandRepo.update(brandId, brandDto);
    return this.brandRepo.findOne({ where: { id: brandId } });
  }

  async find(
    findDTO?: FindBrandRequestDTO,
  ): Promise<PaginatedResponseDTO<BrandEntity>> {
    findDTO = plainToInstance(FindBrandRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindBrandRequestDTO);

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
    orderBy = orderBy || [BrandOrder.NAME_ASC];
    findManyOptions.order = {};
    for (let orderItem of orderBy) {
      const [column, direction] = orderItem.split('_');
      findManyOptions.order[column] = direction;
    }

    // results
    const [results, count] = await this.brandRepo.findAndCount(findManyOptions);
    return new PaginatedResponseDTO(results, count, page, pageSize);
  }

  async findById(brandId: number) {
    if (!brandId)
      throw new UnprocessableEntityException(BrandMessage.ID_REQUIRED);
    const brand = await this.brandRepo.findOne({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    return brand;
  }

  async delete(brandId: number): Promise<SuccessResponseDto> {
    if (!brandId)
      throw new UnprocessableEntityException(BrandMessage.ID_REQUIRED);
    const brand = await this.brandRepo.findOne({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    await this.brandRepo.softDelete(brandId);
    return new SuccessResponseDto();
  }
}
