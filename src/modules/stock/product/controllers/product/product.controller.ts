import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalAuthentication } from '../../../../authentication/decorators/skip-authentication';
import { Role } from '../../../../authentication/enums/role/role.enum';
import { PaginatedResponseDTO } from '../../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../../system/dtos/response/pagination/success.response.dto';
import { QueryParamToJsonInterceptor } from '../../../../system/interceptors/query-param-to-json/query-param-to-json.interceptor';
import { UuidValidationPipe } from '../../../../system/pipes/uuid/uuid-validation.pipe';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { CreateProductRequestDTO } from '../../dtos/create-product/create-product.request.dto';
import { FindProductRequestDTO } from '../../dtos/find-products/find-products.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/update-product/update-product.request.dto';
import { ProductOrder } from '../../enums/product-order/product-order.enum';
import { Product } from '../../models/product/product.entity';
import { ProductService } from '../../services/product/product.service';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private productService: ProductService) {}

  // product data
  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  create(@Body() data: CreateProductRequestDTO): Promise<Product> {
    return this.productService.create(data);
  }

  @Patch('/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  update(
    @Param('productId', new UuidValidationPipe('product id')) productId: string,
    @Body() brand: UpdateProductRequestDTO,
  ): Promise<Product> {
    return this.productService.update(productId, brand);
  }

  @Get()
  // @Roles(Role.ROOT, Role.ADMIN)
  @OptionalAuthentication() // TODO: allow inactive access only to authorized users
  @UseInterceptors(QueryParamToJsonInterceptor)
  find(
    @Query() findDTO: { query: FindProductRequestDTO },
  ): Promise<PaginatedResponseDTO<Product, ProductOrder>> {
    return this.productService.find(findDTO.query);
  }

  @Get('/:productId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @OptionalAuthentication()
  findById(
    @Param('productId', new UuidValidationPipe('product id')) productId: string,
  ): Promise<Product> {
    return this.productService.findById(productId);
  }

  @Delete('/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  delete(
    @Param('productId', new UuidValidationPipe('product id')) productId: string,
  ): Promise<SuccessResponseDto> {
    return this.productService.delete(productId);
  }
}
