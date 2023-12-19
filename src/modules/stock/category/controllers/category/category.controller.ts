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
  UnauthorizedException,
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
import { CreateCategoryRequestDTO } from '../../dtos/create-category/create-category.request.dto';
import { FindCategoriesRequestDTO } from '../../dtos/find-categories/find-categories.request.dto';
import { UpdateCategoryRequestDTO } from '../../dtos/update-category/update-category.request.dto';
import { CategoryOrder } from '../../enums/category-order/category-order.enum';
import { CategoryMessage } from '../../messages/category/category.messages.enum';
import { Category } from '../../models/category/category.entity';
import { CategoryService } from '../../services/category/category.service';

// TODO: mover para decorator
function checkPermissions(
  query: { active?: ActiveFilter; deleted?: DeletedFilter },
  user: User,
) {
  if (
    !user ||
    !user.roles ||
    (!user.roles.includes(Role.ADMIN) && !user.roles.includes(Role.ROOT))
  ) {
    if (
      query.active == ActiveFilter.ALL ||
      query.active == ActiveFilter.INACTIVE
    ) {
      throw new UnauthorizedException(CategoryMessage.PRIVATE_ACCESS);
    }
    if (
      query.deleted == DeletedFilter.ALL ||
      query.deleted == DeletedFilter.DELETED
    ) {
      throw new UnauthorizedException(CategoryMessage.DELETED_ACCESS);
    }
  }
}

function isPublicAccess(user: User): boolean {
  if (!user) {
    return true;
  }
  if (!user.roles) {
    return true;
  }
  if (!user.roles.includes(Role.ADMIN) && !user.roles.includes(Role.ROOT)) {
    return true;
  }
  return false;
}

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
    @Req() req: { user: User },
    @Query() findDTO: { query: FindCategoriesRequestDTO },
  ): Promise<PaginatedResponseDTO<Category, CategoryOrder>> {
    checkPermissions(findDTO.query, req.user);
    return this.categoryService.find(findDTO.query);
  }

  @Get('/:categoryId')
  @OptionalAuthentication()
  @UseInterceptors(QueryParamToJsonInterceptor)
  findById(
    @Req() req: { user: User },
    @Param('categoryId', new UuidValidationPipe('category id'))
    categoryId: string,
    @Query() findDTO: { query: FindCategoriesRequestDTO },
  ): Promise<Category> {
    checkPermissions(findDTO.query, req.user);
    return this.categoryService.findById(categoryId, isPublicAccess(req.user));
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
