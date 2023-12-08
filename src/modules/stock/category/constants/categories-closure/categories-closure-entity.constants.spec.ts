import { testConvertStaticPropertiesToObject } from '../../../../../test/test-utils';
import { CategoriesClosureConstants } from './categories-closure-entity.constants';

describe('CategoriesClosureConstants', () => {
  it('should de defined', () => {
    expect(CategoriesClosureConstants).toBeDefined();
  });

  it('sohuld have correct properties', () => {
    const values = testConvertStaticPropertiesToObject(
      CategoriesClosureConstants,
    );
    expect(values).toEqual({
      CATEGORIES_CLOSURE: 'categories_closure',
      ALL_COLUMNS: '*',
      CLOSURE: 'closure',
      ID_EQUALS_TO_ID_DESCENDANT: 'id == id_descendant',
      ID_ANCESTOR_DIFFERENT_FROM_ID_DESCENDANT: 'id_ancestor <> id_descendant',
      PARENT_ID_EQUAL_TO_ID_ANCESTOR: 'parentId == id_ancestor',
      PARENT_ID_IS_NULL: 'parentId IS NULL',
      PARENTID_IN: 'parentId IN (:...parentIds)',
    });
  });
});
