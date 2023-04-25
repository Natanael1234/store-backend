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
import { CreateBrandRequestDTO } from '../../dtos/request/create-brand/create-brand.request.dto';
import { UpdateBrandRequestDTO } from '../../dtos/request/update-brand/update-brand.request.dto';
import { SuccessResponseDto } from '../../dtos/response/success.response.dto';
import { BrandEntity } from '../../models/brand/brand.entity';
import { BrandService } from '../../services/brand/brand.service';

@Controller('brands')
export class BrandController {
  constructor(private stockService: BrandService) {}

  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  createBrand(@Body() brand: CreateBrandRequestDTO): Promise<BrandEntity> {
    return this.stockService.createBrand(brand);
  }

  @Patch('/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  updateBrand(
    @Param() params: { brandId: number },
    @Body() brand: UpdateBrandRequestDTO,
  ): Promise<BrandEntity> {
    return this.stockService.updateBrand(params.brandId, brand);
  }

  @Get()
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findBrands(): Promise<BrandEntity[]> {
    return this.stockService.findBrands();
  }

  @Get('/search')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  searchBrands(@Query() params: { query: string }): Promise<BrandEntity[]> {
    return this.stockService.searchBrands(params.query);
  }

  @Get('/:brandId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findBrand(@Param() params: { brandId: number }): Promise<BrandEntity> {
    return this.stockService.findBrand(params.brandId);
  }

  @Delete('/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  deleteBrand(
    @Param() params: { brandId: number },
  ): Promise<SuccessResponseDto> {
    return this.stockService.deleteBrand(params.brandId);
  }
}
