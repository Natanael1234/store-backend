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
import { CategoryEntity } from '../../models/category/category.entity';
import { CategoryService } from '../../services/category/category.service';
import { CreateCategoryRequestDTO } from './dtos/request/create-category/create-category.request.dto';
import { FindCategoriesRequestDTO } from './dtos/request/find-categories/find-categories.request.dto';
import { UpdateCategoryRequestDTO } from './dtos/request/update-category/update-category.request.dto';

@Controller('categories')
export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  @Post()
  @Roles(Role.ROOT, Role.ADMIN)
  create(@Body() category: CreateCategoryRequestDTO): Promise<CategoryEntity> {
    return this.categoryService.create(category);
  }

  @Patch('/:categoryId')
  @Roles(Role.ROOT, Role.ADMIN)
  update(
    @Param() params: { categoryId: number },
    @Body() category: UpdateCategoryRequestDTO,
  ): Promise<CategoryEntity> {
    return this.categoryService.update(params.categoryId, category);
  }

  @Get()
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  find(
    @Query() findDTO: FindCategoriesRequestDTO,
  ): Promise<PaginatedResponseDTO<CategoryEntity>> {
    return this.categoryService.find(findDTO);
  }

  @Get('/:categoryId')
  // @Roles(Role.ROOT, Role.ADMIN)
  @SkipAuthentication()
  findById(@Param() params: { categoryId: number }): Promise<CategoryEntity> {
    return this.categoryService.findById(params.categoryId);
  }

  @Delete('/:categoryId')
  @Roles(Role.ROOT, Role.ADMIN)
  delete(@Param() params: { categoryId: number }): Promise<SuccessResponseDto> {
    return this.categoryService.delete(params.categoryId);
  }
}
