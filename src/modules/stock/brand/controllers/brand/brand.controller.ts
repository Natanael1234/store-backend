import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OptionalAuthentication } from '../../../../authentication/decorators/skip-authentication';
import { Role } from '../../../../authentication/enums/role/role.enum';
import { PaginatedResponseDTO } from '../../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../../system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { QueryParamToJsonInterceptor } from '../../../../system/interceptors/query-param-to-json/query-param-to-json.interceptor';
import { UuidValidationPipe } from '../../../../system/pipes/uuid/uuid-validation.pipe';
import { Roles } from '../../../../user/decorators/roles/roles.decorator';
import { User } from '../../../../user/models/user/user.entity';
import { CreateBrandRequestDTO } from '../../dtos/create-brand/create-brand.request.dto';
import { FindBrandRequestDTO } from '../../dtos/find-brands/find-brands.request.dto';
import { UpdateBrandRequestDTO } from '../../dtos/update-brand/update-brand.request.dto';
import { BrandOrder } from '../../enums/brand-order/brand-order.enum';
import { Brand } from '../../models/brand/brand.entity';
import { BrandService } from '../../services/brand/brand.service';

function filterFindDtoByPermission(query: FindBrandRequestDTO, user: User) {
  if (
    !user ||
    !user.roles ||
    (!user.roles.includes(Role.ADMIN) && !user.roles.includes(Role.ROOT))
  ) {
    if (query) {
      query.active = ActiveFilter.ACTIVE;
      query.deleted = DeletedFilter.NOT_DELETED;
    }
  }
}

@ApiTags('brands')
@Controller('brands')
export class BrandController {
  constructor(private brandService: BrandService) {}

  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  create(@Body() createDto: CreateBrandRequestDTO): Promise<Brand> {
    return this.brandService.create(createDto);
  }

  @Patch('/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  update(
    @Param('brandId', new UuidValidationPipe('brand id')) brandId: string,
    @Body() updateDto: UpdateBrandRequestDTO,
  ): Promise<Brand> {
    return this.brandService.update(brandId, updateDto);
  }

  @Get()
  @OptionalAuthentication()
  @UseInterceptors(QueryParamToJsonInterceptor)
  find(
    @Req() req: { user: User },
    @Query() findDTO: { query: FindBrandRequestDTO },
  ): Promise<PaginatedResponseDTO<Brand, BrandOrder>> {
    filterFindDtoByPermission(findDTO.query, req.user);
    return this.brandService.find(findDTO.query);
  }

  @Get('/:brandId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @OptionalAuthentication()
  findById(
    @Param('brandId', new UuidValidationPipe('brand id')) brandId: string,
  ): Promise<Brand> {
    return this.brandService.findById(brandId);
  }

  @Delete('/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  @UseInterceptors(QueryParamToJsonInterceptor)
  delete(
    @Param('brandId', new UuidValidationPipe('brand id')) brandId: string,
  ): Promise<SuccessResponseDto> {
    return this.brandService.delete(brandId);
  }
}
