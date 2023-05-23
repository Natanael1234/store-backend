import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';
import { CategoryMessage } from '../enums/messages/category-messages/category-messages.enum';
import { CategoryEntity } from '../models/category/category.entity';

type BulkCategoriesData = {
  name: string;
  active?: boolean;
  parentId?: number;
};

@Injectable()
export class CategoryRepository extends Repository<CategoryEntity> {
  constructor(
    @InjectRepository(CategoryEntity)
    repository: Repository<CategoryEntity>,
  ) {
    super(repository.target, repository.manager, repository.queryRunner);
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
}
