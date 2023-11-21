import { NumberConfigs } from './number.configs';

describe('NumberConfigs', () => {
  it('should de defined', () => {
    expect(NumberConfigs).toBeDefined();
  });

  it('should have MIN_NUMBER defined as Number.MIN_SAFE_INTEGER', () => {
    expect(NumberConfigs.MIN_NUMBER).toEqual(Number.MIN_SAFE_INTEGER);
  });

  it('should have MAX_NUMBER defined as Number.MAX_SAFE_INTEGER', () => {
    expect(NumberConfigs.MAX_NUMBER).toEqual(Number.MAX_SAFE_INTEGER);
  });
});
