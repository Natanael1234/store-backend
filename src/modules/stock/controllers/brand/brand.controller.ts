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
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../system/dtos/response/pagination/success.response.dto';
import { Roles } from '../../../user/decorators/roles/roles.decorator';
import { BrandEntity } from '../../models/brand/brand.entity';
import { BrandService } from '../../services/brand/brand.service';
import { CreateBrandRequestDTO } from './dtos/request/create-brand/create-brand.request.dto';
import { FindBrandRequestDTO } from './dtos/request/find-brands/find-brands.request.dto';
import { UpdateBrandRequestDTO } from './dtos/request/update-brand/update-brand.request.dto';

@Controller('brands')
export class BrandController {
  constructor(private brandService: BrandService) {}

  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  create(@Body() brand: CreateBrandRequestDTO): Promise<BrandEntity> {
    return this.brandService.create(brand);
  }

  @Patch('/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  update(
    @Param() params: { brandId: number },
    @Body() brand: UpdateBrandRequestDTO,
  ): Promise<BrandEntity> {
    return this.brandService.update(params.brandId, brand);
  }

  @Get()
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  find(
    @Query() findDTO: FindBrandRequestDTO,
  ): Promise<PaginatedResponseDTO<BrandEntity>> {
    return this.brandService.find(findDTO);
  }

  @Get('/:brandId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findById(@Param() params: { brandId: number }): Promise<BrandEntity> {
    return this.brandService.findById(params.brandId);
  }

  @Delete('/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  delete(@Param() params: { brandId: number }): Promise<SuccessResponseDto> {
    return this.brandService.delete(params.brandId);
  }
}
