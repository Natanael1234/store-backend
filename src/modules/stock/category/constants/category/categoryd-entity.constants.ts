export class CategoryConstants {
  static readonly CATEGORY = 'category';
  static readonly CATEGORY_ID = 'category.id';
  static readonly CATEGORY_NAME = 'category.name';
  static readonly CATEGORY_ACTIVE = 'category.active';
  static readonly CATEGORY_CREATED = 'category.created';
  static readonly CATEGORY_UPDATED = 'category.updated';
  static readonly CATEGORY_DELETED_AT = 'category.deletedAt';
  static readonly CATEGORY_PARENT_ID = 'category.parentId';
  static readonly CATEGORY_PARENT = 'category.parent';
  static readonly CATEGORY_CHILDREN = 'category.children';

  static readonly ID = 'id';
  static readonly NAME = 'name';
  static readonly ACTIVE = 'active';
  static readonly CREATED = 'created';
  static readonly UPDATED = 'updated';
  static readonly DELETED_AT = 'deletedAt';
  static readonly PARENT_ID = 'parentId';
  static readonly PARENT = 'parent';
  static readonly CHILDREN = 'children';
  static readonly CHILDREN_NAME = 'children.name';

  static readonly CATEGORY_ID_EQUALS_TO = 'category.id = :categoryId';
  static readonly CATEGORY_ID_IN = 'category.id IN (:...categoryIds)';
  static readonly CATEGORY_PARENT_ID_IN =
    'category.parentId IN (:...parentIds)';
  static readonly CATEGORY_ID_IS_NOT_NULL = 'category.id IS NOT NULL';
  static readonly CATEGORY_NAME_LIKE_TEXT_QUERY =
    'LOWER(category.name) LIKE :textQuery';
  static readonly CATEGORY_ACTIVE_EQUALS_TO = 'category.active = :active';

  static readonly CATEGORY_DELETED_AT_IS_NOT_NULL =
    'category.deletedAt IS NOT NULL';
  static readonly PARENT_IS_NULL = 'category.parent IS NULL';
}
