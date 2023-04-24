import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Param } from '@nestjs/common/decorators';
import { SkipAuthentication } from '../../authentication/decorators/skip-authentication';
import { Role } from '../../authentication/enums/role/role.enum';
import { Roles } from '../../user/decorators/roles/roles.decorator';
import { CreateBrandRequestDTO } from '../dtos/request/create-brand/create-brand.request.dto';
import { CreateProductRequestDTO } from '../dtos/request/create-product/create-product.request.dto';
import { UpdateBrandRequestDTO } from '../dtos/request/update-brand/update-brand.request.dto';
import { UpdateProductRequestDTO } from '../dtos/request/update-product/update-product.request.dto';
import { SuccessResponseDto } from '../dtos/response/success.response.dto';
import { BrandEntity } from '../models/brand/brand.entity';
import { ProductEntity } from '../models/product/product.entity';
import { StockService } from '../services/stock/stock.service';

@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Post('brands')
  @Roles(Role.ROOT, Role.ADMIN)
  createBrand(@Body() brand: CreateBrandRequestDTO): Promise<BrandEntity> {
    return this.stockService.createBrand(brand);
  }

  @Patch('brands/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  updateBrand(
    @Param() params: { brandId: number },
    @Body() brand: UpdateBrandRequestDTO,
  ): Promise<BrandEntity> {
    return this.stockService.updateBrand(params.brandId, brand);
  }

  @Get('brands')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findBrands(): Promise<BrandEntity[]> {
    return this.stockService.findBrands();
  }

  @Get('brands/search')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  searchBrands(@Query() params: { query: string }): Promise<BrandEntity[]> {
    return this.stockService.searchBrands(params.query);
  }

  @Get('brands/:brandId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findBrand(@Param() params: { brandId: number }): Promise<BrandEntity> {
    return this.stockService.findBrand(params.brandId);
  }

  @Delete('brands/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  deleteBrand(
    @Param() params: { brandId: number },
  ): Promise<SuccessResponseDto> {
    return this.stockService.deleteBrand(params.brandId);
  }

  @Post('products')
  @Roles(Role.ROOT, Role.ADMIN)
  createProduct(
    @Body() product: CreateProductRequestDTO,
  ): Promise<ProductEntity> {
    return this.stockService.createProduct(product);
  }

  @Patch('products/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  updateProduct(
    @Param() params: { productId: number },
    @Body() brand: UpdateProductRequestDTO,
  ): Promise<ProductEntity> {
    return this.stockService.updateProduct(params.productId, brand);
  }

  @Get('products')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findProducts(): Promise<ProductEntity[]> {
    return this.stockService.findProducts();
  }

  @Get('products/search')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  searchProducts(@Query() params: { query: string }): Promise<ProductEntity[]> {
    return this.stockService.searchProducts(params.query);
  }

  @Get('products/:productId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findProduct(@Param() params: { productId: number }): Promise<ProductEntity> {
    return this.stockService.findProduct(params.productId);
  }

  @Delete('products/:productId')
  @Roles(Role.ROOT, Role.ADMIN)
  deleteProduct(
    @Param() params: { productId: number },
  ): Promise<SuccessResponseDto> {
    return this.stockService.deleteProduct(params.productId);
  }
}
