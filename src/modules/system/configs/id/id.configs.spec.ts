import { IdConfigs } from './id.configs';

describe('IdListConfigs', () => {
  it('should de defined', () => {
    expect(IdConfigs).toBeDefined();
  });

  it('should have MIN_ID defined as 1', () => {
    expect(IdConfigs.MIN_ID).toEqual(1);
  });

  it('should have MIN_ID defined as Number.MAX_SAFE_INTEGER', () => {
    expect(IdConfigs.MAX_ID).toEqual(Number.MAX_SAFE_INTEGER);
  });
});
