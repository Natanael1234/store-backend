import { CreateCategoryRequestDTO } from '../../modules/stock/controllers/category/dtos/request/create-category/create-category.request.dto';
import { CategoryEntity } from '../../modules/stock/models/category/category.entity';
import { CategoryRepository } from '../../modules/stock/repositories/category.repository';

export type CompareExpectedTreesExpectedData = {
  id?: number;
  name: string;
  active: boolean;
  deleted?: boolean;
  parent?: {
    id: number;
    name: string;
    active: boolean;
  };
  children?: CompareExpectedTreesExpectedData[];
};
export class TestCategoryData {
  public static get dataForRepository() {
    return [
      { name: 'Category 1', active: true },
      { name: 'Category 2', active: true, parentId: 1 },
      { name: 'Category 3', active: false, parentId: 2 },
      { name: 'Category 4', parentId: 1 },
    ];
  }

  public static buildData(quantity: number, startNumber?: number) {
    if (startNumber == null) startNumber = 1;
    const data = Array(quantity)
      .fill(null)
      .map((v, i) => {
        return {
          name: `Category ${startNumber++}`,
          active: true,
          parentId: undefined,
        };
      });
    return data;
  }

  public static getExpectedResults(options?: {
    parent?: boolean;
    children?: boolean;
  }) {
    options = options || { parent: true, children: true };
    const expectedData = [
      {
        id: 1,
        name: 'Clothing',
        active: true,
        parent: null,
        children: [
          { id: 3, name: "Men's clothing", active: true },
          { id: 4, name: "Women's clothing", active: true },
        ],
      },
      {
        id: 2,
        name: 'Appliances',
        active: true,
        parent: null,
        children: [],
      },
      {
        id: 3,
        name: "Men's clothing",
        active: true,
        parent: { id: 1, name: 'Clothing', active: true },
        children: [
          {
            id: 5,
            name: "Men's shirt",
            active: true,
          },
        ],
      },
      {
        id: 4,
        name: "Women's clothing",
        active: true,
        parent: { id: 1, name: 'Clothing', active: true },
        children: [],
      },
      {
        id: 5,
        name: "Men's shirt",
        active: true,
        parent: { id: 3, name: "Men's clothing", active: true },
        children: [],
      },
    ];
    for (let data of expectedData) {
      if (!options.parent) {
        delete data.parent;
      }
      if (!options.children) {
        delete data.children;
      }
    }
    return expectedData;
  }

  public static getRepositoryCreationEntities() {
    // id 1
    const clothing = new CategoryEntity();
    clothing.name = 'Clothing';
    clothing.active = true;

    // id 2
    const eletronics = new CategoryEntity();
    eletronics.name = 'Appliances';
    eletronics.active = true;

    // id 3
    const mensClothing = new CategoryEntity();
    mensClothing.name = "Men's clothing";
    mensClothing.parent = clothing;
    mensClothing.active = true;

    // id 4
    const womensClothing = new CategoryEntity();
    womensClothing.name = "Women's clothing";
    womensClothing.parent = clothing;
    womensClothing.active = true;

    // id 5
    const mensShirt = new CategoryEntity();
    mensShirt.name = "Men's shirt";
    mensShirt.parent = mensClothing;
    mensShirt.active = true;

    return [clothing, eletronics, mensClothing, womensClothing, mensShirt];
  }

  public static getServiceCreationCategoryData() {
    // id 1
    const clothing = new CreateCategoryRequestDTO();
    clothing.name = 'Clothing';
    clothing.active = true;

    // id 2
    const eletronics = new CreateCategoryRequestDTO();
    eletronics.name = 'Appliances';
    eletronics.active = true;

    // id 3
    const mensClothing = new CreateCategoryRequestDTO();
    mensClothing.name = "Men's clothing";
    mensClothing.parentId = 1;
    mensClothing.active = true;

    // id 4
    const womensClothing = new CreateCategoryRequestDTO();
    womensClothing.name = "Women's clothing";
    womensClothing.parentId = 1;
    womensClothing.active = true;

    // id 5
    const mensShirt = new CreateCategoryRequestDTO();
    mensShirt.name = "Men's shirt";
    mensShirt.parentId = 3;
    mensShirt.active = true;

    return [clothing, eletronics, mensClothing, womensClothing, mensShirt];
  }

  public static async createCategoriesViaRepository(
    categoryRepo: CategoryRepository,
  ) {
    const categoryEntities = TestCategoryData.getRepositoryCreationEntities();
    for (const categoryEntity of categoryEntities) {
      await categoryRepo.save(categoryEntity);
    }
    return categoryEntities;
  }

  public async createCategories(repository: CategoryRepository) {
    // id 1
    const clothingCategory = new CategoryEntity();
    clothingCategory.name = 'Clothing';
    clothingCategory.active = true;
    await repository.manager.save(clothingCategory);

    // id 2
    const eletronicsCategory = new CategoryEntity();
    eletronicsCategory.name = 'Appliances';
    eletronicsCategory.active = true;
    await repository.manager.save(eletronicsCategory);

    // id 3
    const mensClothingCategory = new CategoryEntity();
    mensClothingCategory.name = "Men's clothing";
    mensClothingCategory.parent = clothingCategory;
    mensClothingCategory.active = true;
    await repository.manager.save(mensClothingCategory);

    // id 4
    const womensClothingCategory = new CategoryEntity();
    womensClothingCategory.name = "Women's clothing";
    womensClothingCategory.parent = clothingCategory;
    womensClothingCategory.active = true;
    await repository.manager.save(womensClothingCategory);

    // id 5
    const mensShirtCategory = new CategoryEntity();
    mensShirtCategory.name = "Men's shirt";
    mensShirtCategory.parent = mensClothingCategory;
    mensShirtCategory.active = true;
    await repository.manager.save(mensShirtCategory);

    return [
      clothingCategory,
      eletronicsCategory,
      mensClothingCategory,
      womensClothingCategory,
      mensShirtCategory,
    ];
  }

  public static getExpectedTrees(): CompareExpectedTreesExpectedData[] {
    const trees: CompareExpectedTreesExpectedData[] = [
      {
        id: 1,
        name: 'Clothing',
        active: true,
        parent: null,
        children: [
          {
            id: 3,
            name: "Men's clothing",
            active: true,
            parent: { id: 1, name: 'Clothing', active: true },
            children: [
              {
                id: 5,
                name: "Men's shirt",
                active: true,
                parent: { id: 3, name: "Men's clothing", active: true },
                children: [],
              },
            ],
          },
          {
            id: 4,
            name: "Women's clothing",
            active: true,
            parent: { id: 1, name: 'Clothing', active: true },
            children: [],
          },
        ],
      },
      {
        id: 2,
        name: 'Appliances',
        active: true,
        parent: null,
        children: [],
      },
    ];

    return trees;
  }
}
