import { testConvertStaticPropertiesToObject } from '../../../../../test/test-utils';
import { CategoryConstants } from './categoryd-entity.constants';

describe('CategoryConstants', () => {
  it('should de defined', () => {
    expect(CategoryConstants).toBeDefined();
  });

  it('sohuld have correct properties', () => {
    const values = testConvertStaticPropertiesToObject(CategoryConstants);
    expect(values).toEqual({
      CATEGORY: 'category',
      CATEGORY_ID: 'category.id',
      CATEGORY_NAME: 'category.name',
      CATEGORY_ACTIVE: 'category.active',
      CATEGORY_CREATED: 'category.created',
      CATEGORY_UPDATED: 'category.updated',
      CATEGORY_DELETED_AT: 'category.deletedAt',
      CATEGORY_PARENT_ID: 'category.parentId',
      CATEGORY_PARENT: 'category.parent',
      CATEGORY_CHILDREN: 'category.children',

      ID: 'id',
      NAME: 'name',
      ACTIVE: 'active',
      CREATED: 'created',
      UPDATED: 'updated',
      DELETED_AT: 'deletedAt',
      PARENT_ID: 'parentId',
      PARENT: 'parent',
      CHILDREN: 'children',
      CHILDREN_NAME: 'children.name',

      CATEGORY_ID_EQUALS_TO: 'category.id = :categoryId',
      CATEGORY_ID_IN: 'category.id IN (:...categoryIds)',
      CATEGORY_PARENT_ID_IN: 'category.parentId IN (:...parentIds)',
      CATEGORY_ID_IS_NOT_NULL: 'category.id IS NOT NULL',
      CATEGORY_NAME_LIKE_TEXT_QUERY: 'LOWER(category.name) LIKE :textQuery',
      CATEGORY_ACTIVE_EQUALS_TO: 'category.active = :isActiveCategory',

      CATEGORY_DELETED_AT_IS_NOT_NULL: 'category.deletedAt IS NOT NULL',
      PARENT_IS_NULL: 'category.parent IS NULL',
    });
  });
});
