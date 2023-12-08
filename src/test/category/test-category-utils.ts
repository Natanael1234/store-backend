import * as _ from 'lodash';
import { Category } from '../../modules/stock/category/models/category/category.entity';
import { CategoryRepository } from '../../modules/stock/category/repositories/category.repository';

function sortCategories(arr: Category[]) {
  if (!arr) return;
  return arr.sort((o1, o2) => {
    if (o1.name < o2.name) {
      return -1;
    } else if (o1.name > o2.name) {
      return 1;
    }

    if (o1.active < o2.active) {
      return -1;
    } else if (o1.active > o2.active) {
      return 1;
    }

    if (o1.id < o2.id) {
      return -1;
    } else if (o1.id > o2.id) {
      return 1;
    }

    if (o1.id < o2.id) {
      return -1;
    } else if (o1.id > o2.id) {
      return 1;
    }

    return 0;
  });
}

// TODO: remover
type ExpectadData = {
  id?: string;
  name: string;
  active: boolean;
  deleted?: boolean;
  parent?: {
    id?: string;
    name: string;
    active: boolean;
  };
  children?: {
    id?: string;
    name: string;
    active: boolean;
  }[];
};

function testValidateCategoryAux(
  category: Category,
  expectedData: ExpectadData,
) {
  expect(category).toBeDefined();
  // id
  if (expectedData.id) {
    expect(category.id).toEqual(expectedData.id);
  } else {
    expect(category.id).toBeDefined();
  }
  // name
  expect(category.name).toEqual(expectedData.name);
  // active
  expect(category.active).toEqual(expectedData.active);
  // parent
  if (expectedData.parent) {
    expect(category.parent).not.toBeNull();
    expect(category.parent).not.toBeUndefined();
    if (expectedData.parent.id) {
      expect(category.parent.id).toEqual(expectedData.parent.id);
    } else {
      expect(category.parent.id).toBeDefined();
    }
    expect(category.parent.name).toEqual(expectedData.parent.name);
    expect(category.parent.active).toEqual(expectedData.parent.active);
  } else if (expectedData.parent === null) {
    expect(category.parent).toBeNull();
  } else if (expectedData.parent === undefined) {
    // expect(category.parent).toBeUndefined();
  }
  // children
  if (expectedData.children) {
    expect(category.children).not.toBeNull();
    expect(category.children).not.toBeUndefined();
    expect(Array.isArray(category.children)).toBeTruthy();
    expect(category.children).toHaveLength(expectedData.children.length);

    // sort children as uuid causes unordered results.
    sortCategories(category.children);
    sortCategories(expectedData.children as Category[]);

    for (let i = 0; i < category.children.length; i++) {
      expect(category.children[i]).toBeDefined();
      if (expectedData.children[i].id) {
        expect(category.children[i].id).toEqual(expectedData.children[i].id);
      } else {
        expect(category.children[i].id).toBeDefined();
      }
      expect(category.children[i].name).toEqual(expectedData.children[i].name);
      expect(category.children[i].active).toEqual(
        expectedData.children[i].active,
      );
    }
  }

  expect(category.created).toBeDefined();
  expect(category.updated).toBeDefined();
  if (expectedData.deleted) {
    expect(category.deletedAt).toBeDefined();
  } else {
    expect(category.deletedAt).toBeNull();
  }

  const allowedProperties = [
    'id',
    'name',
    'active',
    'parent',
    'children',
    'created',
    'updated',
    'deletedAt',
  ];
  for (const prop of Object.keys(category)) {
    expect(allowedProperties).toContain(prop);
  }
}

export function testValidateCategory(
  category: Category,
  expectedData: ExpectadData,
) {
  // clone to not change parameters.
  expectedData = _.cloneDeep(expectedData);
  category = _.cloneDeep(category);
  testValidateCategoryAux(category, expectedData);
}

function testValidateCategoriesAux(
  categories: Category[],
  expectedData: ExpectadData[],
) {
  expect(categories).toBeDefined();
  expect(categories).toHaveLength(expectedData.length);

  // sort categories as uuid causes unordered results.
  sortCategories(categories);
  sortCategories(expectedData as Category[]);

  for (let i = 0; i < categories.length; i++) {
    testValidateCategoryAux(categories[i], expectedData[i]);
  }
}

export function testValidateCategories(
  categories: Category[],
  expectedData: ExpectadData[],
) {
  // clone to not change parameters.
  expectedData = _.cloneDeep(expectedData);
  categories = _.cloneDeep(categories);

  testValidateCategoriesAux(categories, expectedData);
}

export type CompareExpectedTreesExpectedData = {
  id?: string;
  name: string;
  active: boolean;
  deleted?: boolean;
  parent?: {
    id: string;
    name: string;
    active: boolean;
  };
  children?: CompareExpectedTreesExpectedData[];
};

function testCompareCategoryTreesAux(
  expectedData: CompareExpectedTreesExpectedData,
  category: Category,
) {
  expect(category).toBeInstanceOf(Category);

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

    // sort children as uuid causes unordered results.
    sortCategories(category.children);
    sortCategories(expectedData.children as Category[]);

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

type ClosureType = {
  id_ancestor: string;
  id_descendant: string;
};

function sortClosures(arr: ClosureType[]) {
  return arr.sort((o1, o2) => {
    if (o1.id_ancestor < o2.id_ancestor) {
      return -1;
    } else if (o1.id_ancestor > o2.id_ancestor) {
      return 1;
    }
    if (o1.id_descendant < o2.id_descendant) {
      return -1;
    } else if (o1.id_descendant > o2.id_descendant) {
      return 1;
    }
    return 0;
  });
}

export async function testCategoryClosures(
  closures: ClosureType[],
  expectedClosures: ClosureType[],
) {
  const sortedClosures = sortClosures(closures);
  const sortedExpectedClosures = sortClosures(expectedClosures);
  expect(sortedClosures).toEqual(sortedExpectedClosures);
}

export function testCompareCategoryTrees(
  expectedData: CompareExpectedTreesExpectedData,
  category: Category,
) {
  // clone to not change parameters.
  expectedData = _.cloneDeep(expectedData);
  category = _.cloneDeep(category);
  testCompareCategoryTreesAux(expectedData, category);
}

export type TestCategoryInsertParams = {
  name: string;
  active?: boolean;
  deletedAt?: Date;
  parentId?: string;
  parentPosition?: number;
};

export async function testInsertCategories(
  categoryRepo: CategoryRepository,
  categories: TestCategoryInsertParams[],
): Promise<string[]> {
  const createdCategories: Category[] = await categoryRepo.bulkCreate(
    categories,
  );
  const ids = createdCategories.map((c) => c.id);
  return ids;
}
