import { TextQueryConfigs } from './text-query.configs';

describe('TextQueryConfigs', () => {
  it('should be defined', () => {
    expect(TextQueryConfigs).toBeDefined();
  });

  it('should receive TEXT_QUERY_MAX_LENGTH', async () => {
    expect(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH).toEqual(35);
  });
});
