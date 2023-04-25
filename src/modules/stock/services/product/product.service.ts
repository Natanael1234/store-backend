import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { validateAndThrows } from '../../../system/utils/validation';
import { CreateProductRequestDTO } from '../../dtos/request/create-product/create-product.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/request/update-product/update-product.request.dto';
import { SuccessResponseDto } from '../../dtos/response/success.response.dto';
import { BrandMessage } from '../../enums/brand-messages/brand-messages.enum';
import { ProductMessage } from '../../enums/product-messages/product-messages.enum';
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

  async createProduct(
    productDto: CreateProductRequestDTO,
  ): Promise<ProductEntity> {
    if (!productDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateAndThrows(productDto, CreateProductRequestDTO);
    const existentBrand = await this.brandRepo.findOne({
      where: { id: productDto.brandId },
    });
    if (!existentBrand) throw new NotFoundException(BrandMessage.NOT_FOUND);
    delete productDto['id'];
    const product = this.productRepo.create(productDto);
    return this.productRepo.save(product);
  }

  async updateProduct(
    productId: number,
    productDto: UpdateProductRequestDTO,
  ): Promise<ProductEntity> {
    if (!productId)
      throw new UnprocessableEntityException(ProductMessage.ID_REQUIRED);
    if (!productDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    await validateAndThrows(productDto, UpdateProductRequestDTO);
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

  async findProducts() {
    return this.productRepo.find({ relations: { brand: true } });
  }

  async searchProducts(query: string) {
    if (typeof query != 'string')
      throw new UnprocessableEntityException('Search must be string');
    if (!query) throw new UnprocessableEntityException('Search is empty'); // TODO: move string to enum
    return await this.productRepo.find({
      where: [
        {
          name: Like(`%${query}%`),
        },
      ],
      relations: { brand: true },
    });
  }

  async findProduct(productId: number) {
    if (!productId)
      throw new UnprocessableEntityException(ProductMessage.ID_REQUIRED);
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: { brand: true },
    });
    if (!product) throw new NotFoundException(ProductMessage.NOT_FOUND);
    return product;
  }

  async deleteProduct(productId: number): Promise<SuccessResponseDto> {
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
