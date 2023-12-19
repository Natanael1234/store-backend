import { SortConfigs } from './sort.configs';

describe('SortConfigs', () => {
  it('should be defined', () => {
    expect(SortConfigs).toBeDefined();
  });

  it('should receive DEFAULT_ORDER_DIRECTION', async () => {
    expect(SortConfigs.DEFAULT_ORDER_DIRECTION).toEqual('ASC');
  });
});
