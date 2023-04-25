import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { validateAndThrows } from '../../../system/utils/validation';
import { CreateBrandRequestDTO } from '../../dtos/request/create-brand/create-brand.request.dto';
import { UpdateBrandRequestDTO } from '../../dtos/request/update-brand/update-brand.request.dto';
import { SuccessResponseDto } from '../../dtos/response/success.response.dto';
import { BrandMessage } from '../../enums/brand-messages/brand-messages.enum';
import { BrandEntity } from '../../models/brand/brand.entity';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(BrandEntity)
    private brandRepo: Repository<BrandEntity>,
  ) {}

  async createBrand(brandDto: CreateBrandRequestDTO): Promise<BrandEntity> {
    if (!brandDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateAndThrows(brandDto, CreateBrandRequestDTO);
    delete brandDto['id'];
    const brand = this.brandRepo.create(brandDto);
    return this.brandRepo.save(brand);
  }

  async updateBrand(
    brandId: number,
    brandDto: UpdateBrandRequestDTO,
  ): Promise<BrandEntity> {
    if (!brandId)
      throw new UnprocessableEntityException(BrandMessage.ID_REQUIRED);
    if (!brandDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateAndThrows(brandDto, UpdateBrandRequestDTO);
    const existentBrand = await this.brandRepo.findOne({
      where: { id: brandId },
    });
    if (!existentBrand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    delete brandDto['id'];
    await this.brandRepo.update(brandId, brandDto);
    return this.brandRepo.findOne({ where: { id: brandId } });
  }

  async findBrands() {
    return this.brandRepo.find();
  }

  async findBrand(brandId: number) {
    if (!brandId)
      throw new UnprocessableEntityException(BrandMessage.ID_REQUIRED);
    const brand = await this.brandRepo.findOne({
      where: { id: brandId },
    });
    if (!brand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    return brand;
  }

  async searchBrands(query: string) {
    // TODO: filtrar ativos
    if (typeof query != 'string')
      throw new UnprocessableEntityException('Search must be string');
    if (!query) throw new UnprocessableEntityException('Search is empty');
    return await this.brandRepo.find({
      where: [
        {
          name: Like(`%${query || ''}%`),
        },
      ],
    });
  }

  async deleteBrand(brandId: number): Promise<SuccessResponseDto> {
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
