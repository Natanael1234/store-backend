import { CategoryEntity } from '../../modules/stock/models/category/category.entity';
import { CompareExpectedTreesExpectedData } from './test-category-data';

const expectedFields = [
  'id',
  'name',
  'active',
  'parent',
  'created',
  'updated',
  'deletedAt',
].sort();

export function testValidateCategory(
  category: CategoryEntity,
  expectedData: any,
) {
  expect(category).toBeDefined();
  expect(category.id).toEqual(expectedData.id);
  expect(category.name).toEqual(expectedData.name);
  expect(category.active).toEqual(expectedData.active);
  if (expectedData.parent) {
    expect(category.parent).toBeDefined();
    expect(category.parent.id).toEqual(expectedData.parent.id);
    expect(category.parent.name).toEqual(expectedData.parent.name);
    expect(category.parent.active).toEqual(expectedData.parent.active);
  } else if (expectedData.parent === null) {
    expect(category.parent).toBeNull();
  }
  expect(category.created).toBeDefined();
  expect(category.updated).toBeDefined();
  expect(category.deletedAt).toBeNull();
  expect(Object.keys(category).sort()).toEqual(expectedFields);
}

export function testValidateCategoriesArrays(
  categories: CategoryEntity[],
  expectedData: any[],
) {
  expect(categories).toHaveLength(expectedData.length);
  for (let i = 0; i < categories.length; i++) {
    testValidateCategory(categories[i], expectedData[i]);
  }
}

// TODO: mergear com o método acima
export function testValidateCategoryEntity(
  expectedData: {
    id?: number;
    name: string;
    active: boolean;
    deleted?: boolean;
    parent?: {
      id: number;
      name: string;
      active: boolean;
    };
    children?: {
      id: number;
      name: string;
      active: boolean;
    }[];
  },
  category: CategoryEntity,
) {
  expect(category).toBeInstanceOf(CategoryEntity);
  if (expectedData?.id) {
    expect(category.id).toEqual(expectedData.id);
  }

  expect(category.name).toEqual(expectedData.name);
  expect(category.active).toEqual(expectedData.active);

  if (expectedData.parent === undefined) {
    expect(category.parent).toBeUndefined();
  } else if (category.parent === null) {
    expect(category.parent).toBeNull();
  } else {
    expect(category.parent).toBeDefined();
    expect(category.parent.id).toEqual(expectedData.parent.id);
    expect(category.parent.name).toEqual(expectedData.parent.name);
    expect(category.parent.active).toEqual(expectedData.parent.active);
  }

  if (expectedData.children) {
    expect(Array.isArray(category.children)).toBeTruthy();
    expect(category.children).toHaveLength(expectedData.children.length);

    for (let i = 0; i < category.children.length; i++) {
      expect(category.children[i]).toBeDefined();
      expect(category.children[i].id).toEqual(expectedData.children[i].id);
      expect(category.children[i].name).toEqual(expectedData.children[i].name);
      expect(category.children[i].active).toEqual(
        expectedData.children[i].active,
      );
    }
  } else {
    expect(category.children).toBeNull();
  }

  expect(category.created).toBeDefined();
  expect(category.updated).toBeDefined();
  if (expectedData?.deleted) {
    expect(category.deletedAt).not.toBeNull();
  } else {
    expect(category.deletedAt).toBeNull();
  }
}

export function testCompareCategoryTrees(
  expectedData: CompareExpectedTreesExpectedData,
  category: CategoryEntity,
) {
  expect(category).toBeInstanceOf(CategoryEntity);
  if (expectedData?.id) {
    expect(category.id).toEqual(expectedData.id);
  }

  expect(category.name).toEqual(expectedData.name);
  expect(category.active).toEqual(expectedData.active);

  if (expectedData.parent === undefined) {
    expect(category.parent).toBeUndefined();
  } else if (category.parent === null) {
    expect(category.parent).toBeNull();
  } else {
    expect(category.parent).toBeDefined();
    expect(category.parent.id).toEqual(expectedData.parent.id);
    expect(category.parent.name).toEqual(expectedData.parent.name);
    expect(category.parent.active).toEqual(expectedData.parent.active);
  }

  if (expectedData.children) {
    expect(Array.isArray(category.children)).toBeTruthy();
    expect(category.children).toHaveLength(expectedData.children.length);
    for (let i = 0; i < category.children.length; i++) {
      testCompareCategoryTrees(expectedData.children[i], category.children[i]);
    }
  } else {
    expect(category.children).toBeNull();
  }

  expect(category.created).toBeDefined();
  expect(category.updated).toBeDefined();
  if (expectedData?.deleted) {
    expect(category.deletedAt).not.toBeNull();
  } else {
    expect(category.deletedAt).toBeNull();
  }
}
