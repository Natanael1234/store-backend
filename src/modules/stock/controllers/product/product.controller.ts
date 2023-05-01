import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SkipAuthentication } from '../../../authentication/decorators/skip-authentication';
import { Role } from '../../../authentication/enums/role/role.enum';
import { FilteringRequestDTO } from '../../../system/dtos/request/filtering/filtering.request.dto';
import { PaginationRequestDTO } from '../../../system/dtos/request/pagination/pagination.request.dto';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../system/dtos/response/pagination/success.response.dto';
import { Roles } from '../../../user/decorators/roles/roles.decorator';
import { CreateProductRequestDTO } from '../../dtos/request/create-product/create-product.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/request/update-product/update-product.request.dto';
import { ProductEntity } from '../../models/product/product.entity';
import { ProductService } from '../../services/product/product.service';

@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  create(@Body() product: CreateProductRequestDTO): Promise<ProductEntity> {
    return this.productService.create(product);
  }

  @Patch('/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  update(
    @Param() params: { productId: number },
    @Body() brand: UpdateProductRequestDTO,
  ): Promise<ProductEntity> {
    return this.productService.update(params.productId, brand);
  }

  @Get()
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  find(
    @Query() filtering: FilteringRequestDTO,
    @Query() pagination: PaginationRequestDTO,
  ): Promise<PaginatedResponseDTO<ProductEntity>> {
    return this.productService.find(filtering, pagination);
  }

  @Get('/:productId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findById(@Param() params: { productId: number }): Promise<ProductEntity> {
    return this.productService.findById(params.productId);
  }

  @Delete('/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  delete(@Param() params: { productId: number }): Promise<SuccessResponseDto> {
    return this.productService.delete(params.productId);
  }
}
