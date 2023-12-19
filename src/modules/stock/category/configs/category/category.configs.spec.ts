import { CategoryOrder } from '../../enums/category-order/category-order.enum';
import { CategoryConfigs } from './category.configs';

// TODO: check if have all properties
describe('CategoryConfigs', () => {
  it('should de defined', () => {
    expect(CategoryConfigs).toBeDefined();
  });

  it('should contain NAME_MIN_LENGTH', () => {
    expect(CategoryConfigs.NAME_MIN_LENGTH).toEqual(2);
  });

  it('should contain NAME_MAX_LENGTH', () => {
    expect(CategoryConfigs.NAME_MAX_LENGTH).toEqual(60);
  });

  it('should contain FILTER_PARENT_IDS_MAX_LENGTH', () => {
    expect(CategoryConfigs.FILTER_PARENT_IDS_MAX_LENGTH).toEqual(8);
  });

  it('should contain CATEGORY_DEFAULT_ORDER_BY', () => {
    expect(CategoryConfigs.CATEGORY_DEFAULT_ORDER_BY).toEqual([
      CategoryOrder.NAME_ASC,
      CategoryOrder.ACTIVE_ASC,
    ]);
  });
});
