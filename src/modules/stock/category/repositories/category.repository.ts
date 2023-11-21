import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Brackets,
  In,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
  TreeRepository,
} from 'typeorm';
import { CategoriesClosureConstants } from '../constants/categories-closure/categories-closure-entity.constants';
import { CategoryMessage } from '../messages/category/category.messages.enum';
import { Category } from '../models/category/category.entity';

type BulkCategoryData = {
  name: string;
  active?: boolean;
  /** Category id. */
  parentId?: string;
  /** Postition, starting at 1, from parent category in the array of categories to be created */
  parentPosition?: number;
  deletedAt?: Date;
};

type CategoryClosure = {
  id_descendant: string;
};

@Injectable()
export class CategoryRepository extends TreeRepository<Category> {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>, // @InjectRepository(CategoryClosureEntity) // private readonly categoryClosureRepository: Repository<CategoryClosureEntity>,
  ) {
    super(categoryRepo.target, categoryRepo.manager, categoryRepo.queryRunner);
  }

  public async bulkCreate(categoriesData: BulkCategoryData[]) {
    const createdCategories: Category[] = [];
    const categoriesAux = new Array<Category>(categoriesData.length);

    // checks if received invalid category data (with both parentId and parentPosition)
    const invalidCategoryData = categoriesData.find((category) => {
      return category.parentId != null && category.parentPosition != null;
    });
    if (invalidCategoryData) {
      throw new Error('Category data contains both id and position');
    }

    // checks if received category data with invalid parentPosition
    const invalidCategoryPosition = categoriesData.find((category, idx) => {
      if (category.parentPosition == null) {
        return false;
      }
      if (typeof category.parentPosition != 'number') {
        return true;
      }
      if (category.parentPosition < 1) {
        return true;
      }
      // only accepts parent category data from positions before the current category data position
      else if (category.parentPosition >= idx + 1) {
        return true;
      }
      return false;
    });
    if (invalidCategoryPosition) {
      throw new Error('Invalid category position');
    }

    // TODO: check for cycles

    // find parent categories
    const parentsIds = [
      ...new Set(
        categoriesData
          .filter((category) => category.parentId)
          .map((category) => category.parentId),
      ),
    ];
    const categories = await this.find({ where: { id: In(parentsIds) } });

    // for each category data
    for (let i = 0; i < categoriesData.length; i++) {
      const categoryData = categoriesData[i];
      // instantiate respective category
      const category = new Category();
      createdCategories[i] = category;
      category.name = categoryData.name;
      category.active = categoryData.active;
      if (categoryData.deletedAt) {
        category.deletedAt = categoryData.deletedAt;
        categoriesAux[i] = category;
      }

      // if parent is a category being created
      if (categoryData.parentPosition != null) {
        category.parent = createdCategories[categoryData.parentPosition - 1];
      }
      // if parent category is a existent category
      else if (categoryData.parentId) {
        const parent = categories.find(
          (otherCategory) => categoryData.parentId == otherCategory.id,
        );
        if (parent) {
          category.parent = parent;
        } else {
          const parent = await this.findOne({
            where: { id: categoryData.parentId },
          });
          if (parent) {
            category.parent = parent;
          } else {
            throw new NotFoundException(
              CategoryMessage.PARENT_CATEGORY_NOT_FOUND +
                ': ' +
                categoryData.parentId,
            );
          }
        }
      }
      // if parent is null
      else {
        category.parent = null;
      }
      // saves the category
      await this.save(category);
      categories.push(category);
    }
    return categories;
  }

  public async getChildrenIds(parentIds: string[]): Promise<string[]> {
    if (!parentIds) {
      parentIds = [null];
    }
    if (!parentIds.length) return [];
    parentIds = [...new Set(parentIds)];

    const query = this.createQueryBuilder()
      // .select('id_descendant')
      .select(CategoriesClosureConstants.ALL_COLUMNS)
      .distinct(true)
      .from(
        CategoriesClosureConstants.CATEGORIES_CLOSURE,
        CategoriesClosureConstants.CLOSURE,
      );

    // non null parentIds
    const filteredParentIds = parentIds.filter((id) => id != null);

    // if should filter by parentId
    const filterByParentIds = !!filteredParentIds.length;

    // if should filter by null parentId
    const filterByNullParentId = filteredParentIds.length < parentIds.length;

    //
    const idListQb = (qb: SelectQueryBuilder<ObjectLiteral>) => {
      qb.where(
        CategoriesClosureConstants.ID_ANCESTOR_DIFFERENT_FROM_ID_DESCENDANT,
      )
        .andWhere(CategoriesClosureConstants.PARENT_ID_EQUAL_TO_ID_ANCESTOR)
        .andWhere(CategoriesClosureConstants.ID_EQUALS_TO_ID_DESCENDANT)
        .andWhere(CategoriesClosureConstants.PARENTID_IN, { parentIds });
    };
    // (id == id_descendant AND parentId IS NULL)
    const nullQb = (qb: SelectQueryBuilder<ObjectLiteral>) => {
      qb.where(CategoriesClosureConstants.ID_EQUALS_TO_ID_DESCENDANT).andWhere(
        CategoriesClosureConstants.PARENT_ID_IS_NULL,
      );
    };
    const idListOrNullQb = (qb: SelectQueryBuilder<ObjectLiteral>) => {
      qb.orWhere(new Brackets(nullQb)).orWhere(new Brackets(idListQb));
    };
    // filter by null parent or parent ids
    if (filterByNullParentId && filterByParentIds) {
      query.where(idListOrNullQb);
    }
    // filter by parent ids
    else if (filterByParentIds) {
      query.where(idListQb);
    }
    // filter by null parent id
    else if (filterByNullParentId) {
      query.where(nullQb);
    } else {
      query
        .andWhere(
          CategoriesClosureConstants.ID_ANCESTOR_DIFFERENT_FROM_ID_DESCENDANT,
        )
        .andWhere(CategoriesClosureConstants.PARENT_ID_EQUAL_TO_ID_ANCESTOR)
        .andWhere(CategoriesClosureConstants.ID_EQUALS_TO_ID_DESCENDANT);
    }
    const closures: CategoryClosure[] = await query.getRawMany();
    const childrenIds = [...new Set(closures.map((c) => c.id_descendant))];
    return childrenIds;
  }
}
