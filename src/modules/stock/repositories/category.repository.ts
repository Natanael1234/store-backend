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
import { CategoryMessage } from '../enums/messages/category-messages/category-messages.enum';
import { CategoryEntity } from '../models/category/category.entity';

type BulkCategoriesData = {
  name: string;
  active?: boolean;
  parentId?: number;
};

type CategoryClosure = {
  id_descendant: number;
};

@Injectable()
export class CategoryRepository extends TreeRepository<CategoryEntity> {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>, // @InjectRepository(CategoryClosureEntity) // private readonly categoryClosureRepository: Repository<CategoryClosureEntity>,
  ) {
    super(categoryRepo.target, categoryRepo.manager, categoryRepo.queryRunner);
  }

  public async bulkCreate(categoriesData: BulkCategoriesData[]) {
    const parentsIds = [
      ...new Set(
        categoriesData
          .filter((category) => category.parentId)
          .map((category) => category.parentId),
      ),
    ];
    const categories = await this.find({ where: { id: In(parentsIds) } });

    for (const categoryData of categoriesData) {
      const category = new CategoryEntity();
      category.name = categoryData.name;
      category.active = categoryData.active;

      // add category parent
      if (categoryData.parentId) {
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
      } else {
        category.parent = null;
      }
      await this.save(category);
      categories.push(category);
    }
    return categories;
  }

  public async getChildrenIds(parentIds: number[]): Promise<number[]> {
    if (!parentIds) {
      parentIds = [null];
    }
    if (!parentIds.length) return [];
    parentIds = [...new Set(parentIds)];

    const query = this.createQueryBuilder()
      // .select('id_descendant')
      .select('*')
      .distinct(true)
      .from('categories_closure', 'closure');

    const filteredParendIds = parentIds.filter((id) => id != null);

    const filterByIds = !!filteredParendIds.length;
    const filterByNull = filteredParendIds.length < parentIds.length;

    const idListQb = (qb: SelectQueryBuilder<ObjectLiteral>) => {
      qb.where('id_ancestor <> id_descendant')
        .andWhere('parentId == id_ancestor')
        .andWhere('id == id_descendant')
        .andWhere('parentId IN (:...parentIds)', { parentIds });
    };
    const nullQb = (qb: SelectQueryBuilder<ObjectLiteral>) => {
      qb.where('id == id_descendant').andWhere('parentId IS NULL');
    };
    const idListOrNullQb = (qb: SelectQueryBuilder<ObjectLiteral>) => {
      qb.orWhere(new Brackets(nullQb)).orWhere(new Brackets(idListQb));
    };
    if (filterByNull && filterByIds) {
      query.where(idListOrNullQb);
    } else if (filterByIds) {
      query.where(idListQb);
    } else if (filterByNull) {
      query.where(nullQb);
    } else {
      query
        .andWhere('id_ancestor <> id_descendant')
        .andWhere('parentId == id_ancestor')
        .andWhere('id == id_descendant');
    }
    const closures: CategoryClosure[] = await query.getRawMany();
    const childrenIds = [...new Set(closures.map((c) => c.id_descendant))];
    return childrenIds;
  }
}
