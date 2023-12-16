import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PaginationConfigs } from '../../../../system/configs/pagination/pagination.configs';
import { PaginatedResponseDTO } from '../../../../system/dtos/response/pagination/pagination.response.dto';
import { SuccessResponseDto } from '../../../../system/dtos/response/pagination/success.response.dto';
import { ActiveFilter } from '../../../../system/enums/filter/active-filter/active-filter.enum';
import { DeletedFilter } from '../../../../system/enums/filter/deleted-filter/deleted-filter.enum';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { isValidUUID } from '../../../../system/utils/validation/uuid/is-valid-uuid-fn';
import { validateOrThrowError } from '../../../../system/utils/validation/validation';
import { CategoryConstants } from '../../constants/category/categoryd-entity.constants';
import { CreateCategoryRequestDTO } from '../../dtos/create-category/create-category.request.dto';
import { FindCategoriesRequestDTO } from '../../dtos/find-categories/find-categories.request.dto';
import { UpdateCategoryRequestDTO } from '../../dtos/update-category/update-category.request.dto';
import { CategoryOrder } from '../../enums/category-order/category-order.enum';
import { CategoryMessage } from '../../messages/category/category.messages.enum';
import { Category } from '../../models/category/category.entity';
import { CategoryRepository } from '../../repositories/category.repository';

const CategoryIdMessage = new UuidMessage('category id');

@Injectable()
export class CategoryService {
  constructor(private categoryRepo: CategoryRepository) {}

  async create(categoryDto: CreateCategoryRequestDTO): Promise<Category> {
    if (!categoryDto)
      throw new BadRequestException(CategoryMessage.DATA_REQUIRED);
    categoryDto = plainToInstance(CreateCategoryRequestDTO, categoryDto);
    await validateOrThrowError(categoryDto, CreateCategoryRequestDTO);
    delete categoryDto['id'];
    const category = new Category();

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

    const ret = await this.categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      )
      .where(CategoryConstants.CATEGORY_ID_EQUALS_TO, {
        categoryId: category.id,
      })
      .getOne();
    return ret;
  }

  async update(
    categoryId: string,
    categoryDto: UpdateCategoryRequestDTO,
  ): Promise<Category> {
    this.validateCategoryId(categoryId);

    if (!categoryDto)
      throw new BadRequestException(CategoryMessage.DATA_REQUIRED);
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
    if (parentId === null) {
      data.parent = null;
    } else if (parentId != null) {
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
    const ret = await this.categoryRepo.findOne({
      where: { id: categoryId },
      relations: { parent: true },
    });

    return ret;
  }

  async find(
    findDTO?: FindCategoriesRequestDTO,
  ): Promise<PaginatedResponseDTO<Category, CategoryOrder>> {
    findDTO = plainToInstance(FindCategoriesRequestDTO, findDTO || {});
    await validateOrThrowError(findDTO || {}, FindCategoriesRequestDTO);
    let { textQuery, active, deleted, parentIds, page, pageSize, orderBy } =
      findDTO;

    let select = this.categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      ); // TODO: filter parent by active state

    // textQuery by name

    if (textQuery) {
      select = select.andWhere(
        CategoryConstants.CATEGORY_NAME_LIKE_TEXT_QUERY,
        { textQuery },
      );
    }

    // active

    if (active == ActiveFilter.ACTIVE) {
      select = select.andWhere(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, {
        active: true,
      });
    } else if (active == ActiveFilter.INACTIVE) {
      select = select.andWhere(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, {
        active: false,
      });
    }

    // deletedAt

    if (deleted == DeletedFilter.DELETED) {
      select = select
        .withDeleted()
        .andWhere(CategoryConstants.CATEGORY_DELETED_AT_IS_NOT_NULL);
    } else if (deleted == DeletedFilter.ALL) {
      select = select.withDeleted();
    }

    // parentId

    if (parentIds) {
      const normalizedParentIds = parentIds.filter((id) => id != null);
      const filterByNullParent = parentIds.length != normalizedParentIds.length;
      const filterByIds = !!normalizedParentIds.length;
      if (filterByIds && filterByNullParent) {
        // TODO: extract to constants
        select = select.andWhere(
          '(parent.id IN (:...parentIds) OR category.parent IS NULL)',
          { parentIds },
        );
      } else if (filterByIds) {
        select = select.andWhere(CategoryConstants.CATEGORY_PARENT_ID_IN, {
          parentIds,
        });
      } else if (filterByNullParent) {
        select = select.andWhere(CategoryConstants.PARENT_IS_NULL);
      }
    }

    // pagination

    page = page || PaginationConfigs.DEFAULT_PAGE;
    pageSize = pageSize || PaginationConfigs.DEFAULT_PAGE_SIZE;
    select = select.take(pageSize).skip((page - 1) * pageSize);

    // sort

    for (let i = 0; i < orderBy.length; i++) {
      const [column, direction] = orderBy[i].split('_'); // TODO: move to DTO
      if (i == 0) {
        select = select.orderBy(
          `category.${column}`,
          direction.toUpperCase() as 'ASC' | 'DESC',
        );
      } else {
        select = select.addOrderBy(
          `category.${column}`,
          direction.toUpperCase() as 'ASC' | 'DESC',
        );
      }
    }

    // results

    const [results, count] = await select.getManyAndCount();

    textQuery = textQuery?.replace(/(^%|%$)/g, '').replace(/%/g, ' ');
    return new PaginatedResponseDTO(
      textQuery,
      count,
      page,
      pageSize,
      orderBy,
      results,
    );
  }

  async findById(categoryId: string, publicAccess?: boolean) {
    this.validateCategoryId(categoryId);
    let select = this.categoryRepo
      .createQueryBuilder(CategoryConstants.CATEGORY)
      .leftJoinAndSelect(
        CategoryConstants.CATEGORY_PARENT,
        CategoryConstants.PARENT,
      ) // TODO: filter parent by active state
      .where(CategoryConstants.CATEGORY_ID_EQUALS_TO, { categoryId });
    if (publicAccess === true) {
      select = select.andWhere(CategoryConstants.CATEGORY_ACTIVE_EQUALS_TO, {
        active: true,
      });
    } else {
      select = select.withDeleted();
    }
    const category = await select.getOne();
    if (!category) throw new NotFoundException(CategoryMessage.NOT_FOUND);
    return category;
  }

  async delete(categoryId: string): Promise<SuccessResponseDto> {
    this.validateCategoryId(categoryId);
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });
    if (!category) throw new NotFoundException(CategoryMessage.NOT_FOUND);
    await this.categoryRepo.softDelete(categoryId);
    return new SuccessResponseDto();
  }

  private validateCategoryId(categoryId: string) {
    if (!categoryId)
      throw new UnprocessableEntityException(CategoryIdMessage.REQUIRED);
    if (!isValidUUID(categoryId)) {
      throw new UnprocessableEntityException(CategoryIdMessage.INVALID);
    }
  }
}
