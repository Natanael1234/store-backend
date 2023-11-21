import { getEnumTransformer } from './enum-transformer';

enum TestEnum {
  A = 'a',
  B = 'b',
}

describe('getEnumTransformer', () => {
  it('should be defined', () => {
    expect(getEnumTransformer).toBeDefined();
  });

  it('should return a function', () => {
    const transformer = getEnumTransformer(TestEnum, {
      defaultValue: TestEnum.A,
    });
    expect(transformer).toBeDefined();
    expect(typeof transformer).toEqual('function');
  });

  it('should return default value when receives null', () => {
    const transformer = getEnumTransformer(TestEnum, {
      defaultValue: TestEnum.A,
    });
    expect(transformer(null)).toEqual(TestEnum.A);
  });

  it('should return undefined when receives null and default value is not defined', () => {
    const transformer = getEnumTransformer(TestEnum, {});
    expect(transformer(null)).toEqual(undefined);
  });

  it('should return undefined when receives undefined and default value is not defined', () => {
    const transformer = getEnumTransformer(TestEnum, {});
    expect(transformer(undefined)).toEqual(undefined);
  });

  it('should return undefined when receives null and options is not defined', () => {
    const transformer = getEnumTransformer(TestEnum);
    expect(transformer(null)).toEqual(undefined);
  });

  it('should return undefined when receives null and options is null', () => {
    const transformer = getEnumTransformer(TestEnum, null);
    expect(transformer(null)).toEqual(undefined);
  });

  it('should return undefined when receives null and options is undefined', () => {
    const transformer = getEnumTransformer(TestEnum, undefined);
    expect(transformer(null)).toEqual(undefined);
  });

  it('should return invalid type value when receives invalid type value', () => {
    const transformer = getEnumTransformer(TestEnum, {
      defaultValue: TestEnum.A,
    });
    expect(transformer(true)).toEqual(true);
  });

  it('should return received valid value different from default value', () => {
    const transformer = getEnumTransformer(TestEnum, {
      defaultValue: TestEnum.A,
    });
    expect(transformer(TestEnum.B)).toEqual(TestEnum.B);
  });

  it('should return received valid value when default value is not defined', () => {
    const transformer = getEnumTransformer(TestEnum, {});
    expect(transformer(TestEnum.B)).toEqual(TestEnum.B);
  });

  it('should return received valid value when options is not defined', () => {
    const transformer = getEnumTransformer(TestEnum);
    expect(transformer(TestEnum.B)).toEqual(TestEnum.B);
  });
});
