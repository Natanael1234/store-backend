import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FindManyOptions, ILike, In, IsNull, Not } from 'typeorm';
import { PaginationConfig } from '../../../system/dtos/request/pagination/configs/pagination.config';
import { PaginatedResponseDTO } from '../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { validateOrThrowError } from '../../../system/utils/validation';
import { CreateCategoryRequestDTO } from '../../dtos/request/create-category/create-category.request.dto';
import { FindCategoriesRequestDTO } from '../../dtos/request/find-categories/find-categories.request.dto';
import { UpdateCategoryRequestDTO } from '../../dtos/request/update-category/update-category.request.dto';
import { CategoryMessage } from '../../enums/messages/category-messages/category-messages.enum';
import { CategoryOrder } from '../../enums/sort/category-order/category-order.enum';
import { CategoryEntity } from '../../models/category/category.entity';
import { CategoryRepository } from '../../repositories/category.repository';

@Injectable()
export class CategoryService {
  pageSize = 12;

  constructor(private categoryRepo: CategoryRepository) {}

  async create(categoryDto: CreateCategoryRequestDTO): Promise<CategoryEntity> {
    if (!categoryDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    categoryDto = plainToInstance(CreateCategoryRequestDTO, categoryDto);
    await validateOrThrowError(categoryDto, CreateCategoryRequestDTO);
    delete categoryDto['id'];
    const category = new CategoryEntity();

    // name
    category.name = categoryDto.name;

    // active
    category.active = categoryDto.active;

    // parent
    if (categoryDto.parentId) {
      const parent = await this.categoryRepo.findOne({
        where: { id: categoryDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(CategoryMessage.PARENT_CATEGORY_NOT_FOUND);
      }
      category.parent = parent;
    }

    await this.categoryRepo.save(category);
    return this.categoryRepo.findOne({
      where: { id: category.id },
      relations: {
        parent: true,
      },
    });
  }

  async update(
    categoryId: number,
    categoryDto: UpdateCategoryRequestDTO,
  ): Promise<CategoryEntity> {
    if (!categoryId)
      throw new UnprocessableEntityException(CategoryMessage.ID_REQUIRED);
    if (!categoryDto) throw new BadRequestException('Data is required'); // TODO: move message to enum
    categoryDto = plainToInstance(UpdateCategoryRequestDTO, categoryDto);
    await validateOrThrowError(categoryDto, UpdateCategoryRequestDTO);

    const { name, active, parentId: parentId } = categoryDto;

    const existentCategory = await this.categoryRepo.findOne({
      where: { id: categoryId },
      relations: { parent: true },
    });
    if (!existentCategory)
      throw new NotFoundException(CategoryMessage.NOT_FOUND);

    const data: any = {};

    // name
    if (name != null) {
      if (name != existentCategory.name) {
        data.name = name;
      }
    }

    // active
    if (active != null) {
      if (active != existentCategory.active) {
        data.active = !!active;
      }
    }

    // parent
    if (parentId != null) {
      if (parentId == existentCategory.id) {
        throw new UnprocessableEntityException(
          CategoryMessage.CANNOT_PARENT_ITSELF,
        );
      }

      if (parentId != existentCategory.parent?.id) {
        // cannot move element to its descendant
        const descendants = await this.categoryRepo.findDescendants(
          existentCategory,
        );
        const targetIsDescendant = descendants.find(
          (descendantCategory) => descendantCategory.id == parentId,
        );
        if (targetIsDescendant) {
          throw new UnprocessableEntityException(
            CategoryMessage.CANNOT_DESCEND_FROM_ITSELF,
          );
        }

        const newParentCategory = await this.categoryRepo.findOne({
          where: { id: parentId },
        });
        if (!newParentCategory) {
          throw new NotFoundException(
            CategoryMessage.PARENT_CATEGORY_NOT_FOUND,
          );
        }
        data.parent = newParentCategory;
      }
    }

    await this.categoryRepo.update(categoryId, data);
    return this.categoryRepo.findOne({
      where: { id: categoryId },
      relations: { parent: true },
    });
  }

  async find(
    findDTO?: FindCategoriesRequestDTO,
  ): Promise<PaginatedResponseDTO<CategoryEntity>> {
    findDTO = plainToInstance(FindCategoriesRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindCategoriesRequestDTO);

    let { query, active, deleted, parentIds, page, pageSize, orderBy } =
      findDTO;
    const findManyOptions: FindManyOptions = {};

    findManyOptions.where = {};

    // text query
    if (query != null) {
      if (query) {
        findManyOptions.where.name = ILike(`%${query.replace(' ', '%')}%`);
      }
    }

    // active
    if (active == ActiveFilter.ACTIVE) {
      findManyOptions.where.active = true;
    } else if (active == ActiveFilter.INACTIVE) {
      findManyOptions.where.active = false;
    }

    // deleted
    if (deleted == DeletedFilter.DELETED) {
      findManyOptions.where.deletedAt = Not(IsNull());
      findManyOptions.withDeleted = true;
    } else if (deleted == DeletedFilter.ALL) {
      findManyOptions.withDeleted = true;
    }

    // pagination
    page = page || PaginationConfig.DEFAULT_PAGE;
    pageSize = pageSize || PaginationConfig.DEFAULT_PAGE_SIZE;
    findManyOptions.take = pageSize;
    findManyOptions.skip = (page - 1) * pageSize;

    // sort
    orderBy = orderBy || [CategoryOrder.NAME_ASC];
    findManyOptions.order = {};
    for (let orderItem of orderBy) {
      const [column, direction] = orderItem.split('_');
      findManyOptions.order[column] = direction;
    }

    // parentId
    if (parentIds?.length) {
      const childrenIds = await this.categoryRepo.getChildrenIds(parentIds);
      findManyOptions.where.id = In(childrenIds);
    }
    findManyOptions.relations = { parent: true };

    // results
    const [results, count] = await this.categoryRepo.findAndCount(
      findManyOptions,
    );
    return new PaginatedResponseDTO(results, count, page, pageSize);
  }

  async findById(categoryId: number) {
    if (!categoryId)
      throw new UnprocessableEntityException(CategoryMessage.ID_REQUIRED);
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
      relations: { parent: true },
    });
    if (!category) throw new NotFoundException(CategoryMessage.NOT_FOUND);
    return category;
  }

  async delete(categoryId: number): Promise<SuccessResponseDto> {
    if (!categoryId)
      throw new UnprocessableEntityException(CategoryMessage.ID_REQUIRED);
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException(CategoryMessage.NOT_FOUND);
    await this.categoryRepo.softDelete(categoryId);
    return new SuccessResponseDto();
  }
}
