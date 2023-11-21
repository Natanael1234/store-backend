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
import { PaginatedResponseDTO } from '../../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../../system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { isValidUUID } from '../../../../system/utils/validation/is-valid-uuid-fn';
import { validateOrThrowError } from '../../../../system/utils/validation/validation';
import { BrandConstants } from '../../constants/brand/brand-entity.constants';
import { CreateBrandRequestDTO } from '../../dtos/create-brand/create-brand.request.dto';
import { FindBrandRequestDTO } from '../../dtos/find-brands/find-brands.request.dto';
import { UpdateBrandRequestDTO } from '../../dtos/update-brand/update-brand.request.dto';
import { BrandOrder } from '../../enums/brand-order/brand-order.enum';
import { BrandMessage } from '../../messages/brand-messages/brand.messages.enum';
import { Brand } from '../../models/brand/brand.entity';

const BrandIdMessage = new UuidMessage('brand id');

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepo: Repository<Brand>,
  ) {}

  async create(brandDto: CreateBrandRequestDTO): Promise<Brand> {
    if (!brandDto) throw new BadRequestException(BrandMessage.DATA_REQUIRED);
    brandDto = plainToInstance(CreateBrandRequestDTO, brandDto);
    await validateOrThrowError(brandDto, CreateBrandRequestDTO);
    delete brandDto['id'];
    const brand = this.brandRepo.create(brandDto);
    return this.brandRepo.save(brand);
  }

  async update(
    brandId: string,
    brandDto: UpdateBrandRequestDTO,
  ): Promise<Brand> {
    if (!brandId)
      throw new UnprocessableEntityException(BrandIdMessage.REQUIRED);
    if (!isValidUUID(brandId)) {
      throw new UnprocessableEntityException(BrandIdMessage.INVALID);
    }
    if (!brandDto) throw new BadRequestException(BrandMessage.DATA_REQUIRED);
    brandDto = plainToInstance(UpdateBrandRequestDTO, brandDto);
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
  ): Promise<PaginatedResponseDTO<Brand, BrandOrder>> {
    findDTO = plainToInstance(FindBrandRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindBrandRequestDTO);

    let { textQuery, active, deleted, page, pageSize, orderBy } = findDTO;

    let select = this.brandRepo.createQueryBuilder(BrandConstants.BRAND);

    // text query

    if (textQuery) {
      select = select.andWhere(BrandConstants.BRAND_NAME_LIKE_TEXT_QUERY, {
        textQuery,
      });
    }

    // active

    if (active == ActiveFilter.ACTIVE) {
      select = select.andWhere(BrandConstants.BRAND_ACTIVE_EQUALS_TO, {
        active: true,
      });
    } else if (active == ActiveFilter.INACTIVE) {
      select = select.andWhere(BrandConstants.BRAND_ACTIVE_EQUALS_TO, {
        active: false,
      });
    }

    // deleted

    if (deleted == DeletedFilter.DELETED) {
      select = select
        .withDeleted()
        .andWhere(BrandConstants.BRAND_DELETED_AT_IS_NOT_NULL);
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
      select = select.addOrderBy(
        `brand.${column}`,
        direction.toUpperCase() as 'ASC' | 'DESC',
      );
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

  async findById(brandId: string) {
    if (!brandId)
      throw new UnprocessableEntityException(BrandMessage.REQUIRED_BRAND_ID);
    const brand = await this.brandRepo.findOne({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    return brand;
  }

  async delete(brandId: string): Promise<SuccessResponseDto> {
    if (!brandId)
      throw new UnprocessableEntityException(BrandMessage.REQUIRED_BRAND_ID);
    const brand = await this.brandRepo.findOne({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    await this.brandRepo.softDelete(brandId);
    const response = new SuccessResponseDto();
    response.status = 'success';
    return response;
  }
}
