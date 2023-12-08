import { Repository } from 'typeorm';
import { Brand } from '../../modules/stock/brand/models/brand/brand.entity';

const expectedFields = [
  'id',
  'name',
  'active',
  'created',
  'updated',
  'deletedAt',
].sort();

// TODO: remover

export function testValidateBrand(
  brand: Brand,
  expectedBrandData: {
    id?: string;
    name: string;
    active: boolean;
    deleted?: boolean;
  },
) {
  expect(brand).toBeDefined();
  if (expectedBrandData.id) {
    expect(brand.id).toEqual(expectedBrandData.id);
  } else {
    expect(brand.id).toBeDefined();
  }
  expect(brand.name).toEqual(expectedBrandData.name);
  expect(brand.active).toEqual(expectedBrandData.active);
  expect(brand.created).toBeDefined();
  expect(brand.updated).toBeDefined();
  if (expectedBrandData.deleted) {
    expect(brand.deletedAt).toBeDefined();
  } else {
    expect(brand.deletedAt).toBeNull();
  }
  expect(Object.keys(brand).sort()).toEqual(expectedFields);
}

export function testValidateBrands(
  brands: Brand[],
  expectedBrandsData: {
    id?: string;
    name: string;
    active: boolean;
    deleted?: boolean;
  }[],
) {
  expect(brands).toBeDefined();
  expect(brands).toHaveLength(expectedBrandsData.length);
  const nonRepeatedIds = [...new Set(brands.map((b) => b.id))];
  expect(nonRepeatedIds).toHaveLength(brands.length);
  for (let i = 0; i < brands.length; i++) {
    testValidateBrand(brands[i], expectedBrandsData[i]);
  }
}

export type TestBrandInsertParams = {
  name: string;
  active?: boolean;
  created?: Date;
  updated?: Date;
  deletedAt?: Date;
};

export async function testInsertBrands(
  brandRepo: Repository<Brand>,
  brands: TestBrandInsertParams[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const brand of brands) {
    const ret = await brandRepo
      .createQueryBuilder()
      .insert()
      .into(Brand)
      .values(brand)
      .execute();
    ids.push(ret.identifiers[0].id);
  }
  return ids;
}
