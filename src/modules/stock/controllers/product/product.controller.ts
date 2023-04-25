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
import { Roles } from '../../../user/decorators/roles/roles.decorator';
import { CreateProductRequestDTO } from '../../dtos/request/create-product/create-product.request.dto';
import { UpdateProductRequestDTO } from '../../dtos/request/update-product/update-product.request.dto';
import { SuccessResponseDto } from '../../dtos/response/success.response.dto';
import { ProductEntity } from '../../models/product/product.entity';
import { ProductService } from '../../services/product/product.service';

@Controller('products')
export class ProductController {
  constructor(private ProductService: ProductService) {}

  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  createProduct(
    @Body() product: CreateProductRequestDTO,
  ): Promise<ProductEntity> {
    return this.ProductService.createProduct(product);
  }

  @Patch('/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  updateProduct(
    @Param() params: { productId: number },
    @Body() brand: UpdateProductRequestDTO,
  ): Promise<ProductEntity> {
    return this.ProductService.updateProduct(params.productId, brand);
  }

  @Get()
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findProducts(): Promise<ProductEntity[]> {
    return this.ProductService.findProducts();
  }

  @Get('/search')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  searchProducts(@Query() params: { query: string }): Promise<ProductEntity[]> {
    return this.ProductService.searchProducts(params.query);
  }

  @Get('/:productId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findProduct(@Param() params: { productId: number }): Promise<ProductEntity> {
    return this.ProductService.findProduct(params.productId);
  }

  @Delete('/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  deleteProduct(
    @Param() params: { productId: number },
  ): Promise<SuccessResponseDto> {
    return this.ProductService.deleteProduct(params.productId);
  }
}
