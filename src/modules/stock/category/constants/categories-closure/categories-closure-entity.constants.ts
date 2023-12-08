export class CategoriesClosureConstants {
  static readonly CATEGORIES_CLOSURE = 'categories_closure';
  static readonly ALL_COLUMNS = '*';
  static readonly CLOSURE = 'closure';
  static readonly ID_EQUALS_TO_ID_DESCENDANT = 'id == id_descendant';
  static readonly ID_ANCESTOR_DIFFERENT_FROM_ID_DESCENDANT =
    'id_ancestor <> id_descendant';
  static readonly PARENT_ID_EQUAL_TO_ID_ANCESTOR = 'parentId == id_ancestor';
  static readonly PARENT_ID_IS_NULL = 'parentId IS NULL';
  static readonly PARENTID_IN = 'parentId IN (:...parentIds)';
}
