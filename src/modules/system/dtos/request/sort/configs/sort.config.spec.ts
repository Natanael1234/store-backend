import { SortConfig } from './sort.config';

describe('SortConfig', () => {
  it('should be defined', () => {
    expect(SortConfig).toBeDefined();
  });

  it('should receive SortConfig.DEFAULT_ORDER', async () => {
    expect(SortConfig.DEFAULT_ORDER_DIRECTION).toEqual('ASC');
  });
});
