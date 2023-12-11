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
import { CreateCategoryRequestDTO } from '../../dtos/create-category/create-category.request.dto';
import { FindCategoriesRequestDTO } from '../../dtos/find-categories/find-categories.request.dto';
import { UpdateCategoryRequestDTO } from '../../dtos/update-category/update-category.request.dto';
import { CategoryOrder } from '../../enums/category-order/category-order.enum';
import { Category } from '../../models/category/category.entity';
import { CategoryService } from '../../services/category/category.service';

@ApiTags('categories')
@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  create(@Body() category: CreateCategoryRequestDTO): Promise<Category> {
    return this.categoryService.create(category);
  }

  @Patch('/:categoryId')
  @Roles(Role.ROOT, Role.ADMIN)
  update(
    @Param('categoryId', new UuidValidationPipe('category id'))
    categoryId: string,
    @Body() category: UpdateCategoryRequestDTO,
  ): Promise<Category> {
    return this.categoryService.update(categoryId, category);
  }

  @Get()
  // @Roles(Role.ROOT, Role.ADMIN)
  @UseInterceptors(QueryParamToJsonInterceptor)
  @OptionalAuthentication()
  find(
    @Query() findDTO: { query: FindCategoriesRequestDTO },
  ): Promise<PaginatedResponseDTO<Category, CategoryOrder>> {
    return this.categoryService.find(findDTO.query);
  }

  @Get('/:categoryId')
  @UseInterceptors(QueryParamToJsonInterceptor)
  // @Roles(Role.ROOT, Role.ADMIN)
  @OptionalAuthentication()
  findById(
    @Param('categoryId', new UuidValidationPipe('category id'))
    categoryId: string,
  ): Promise<Category> {
    return this.categoryService.findById(categoryId);
  }

  @Delete('/:categoryId')
  @UseInterceptors(QueryParamToJsonInterceptor)
  @Roles(Role.ROOT, Role.ADMIN)
  delete(
    @Param('categoryId', new UuidValidationPipe('category id'))
    categoryId: string,
  ): Promise<SuccessResponseDto> {
    return this.categoryService.delete(categoryId);
  }
}
