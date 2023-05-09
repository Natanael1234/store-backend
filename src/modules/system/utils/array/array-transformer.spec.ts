import { getArrayTransformer } from './array-transformer';

describe('arrayTransformer', () => {
  it('should be defined', () => {
    expect(getArrayTransformer).toBeDefined();
  });

  it('should return a function', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    expect(transformer).toBeDefined();
    expect(typeof transformer).toEqual('function');
  });

  it('should transform null into empty array', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: true,
    });
    const ret = transformer(null);
    expect(ret).toEqual([]);
  });

  it('should transform null into array with defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer(null);
    expect(ret).toEqual(['default value']);
  });

  it('should transform undefined into empty array', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: true,
    });
    const ret = transformer(undefined);
    expect(ret).toEqual([]);
  });

  it('should transform undefined into array with defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer(undefined);
    expect(ret).toEqual(['default value']);
  });

  it('should not transform empty array', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: true,
    });
    const ret = transformer([]);
    expect(ret).toEqual([]);
  });

  it('should transform accepts multiple default values into array with defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value 1', 'default value 2'],
      removeDuplicated: true,
    });
    const ret = transformer(null);
    expect(ret).toEqual(['default value 1', 'default value 2']);
  });

  it('should transform empty array into array with defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer([]);
    expect(ret).toEqual(['default value']);
  });

  it('should transform empty array into array with defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer([]);
    expect(ret).toEqual(['default value']);
  });

  it('should keep order', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer(['value2', 'value3', 'value1']);
    expect(ret).toEqual(['value2', 'value3', 'value1']);
  });

  it('should remove duplicated values', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer([
      'value2',
      'value3',
      'value2',
      'value1',
      'value1',
      'value2',
    ]);
    expect(ret).toEqual(['value2', 'value3', 'value1']);
  });

  it('should not remove duplicated values', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: false,
    });
    const ret = transformer([
      'value2',
      'value3',
      'value2',
      'value1',
      'value1',
      'value2',
    ]);
    expect(ret).toEqual([
      'value2',
      'value3',
      'value2',
      'value1',
      'value1',
      'value2',
    ]);
  });

  it('should not remove duplicated values by default', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
    });
    const ret = transformer([
      'value2',
      'value3',
      'value2',
      'value1',
      'value1',
      'value2',
    ]);
    expect(ret).toEqual([
      'value2',
      'value3',
      'value2',
      'value1',
      'value1',
      'value2',
    ]);
  });

  it('should not remove duplicated values by default when do not receive options', () => {
    const transformer = getArrayTransformer();
    const ret = transformer([
      'value2',
      'value3',
      'value2',
      'value1',
      'value1',
      'value2',
    ]);
    expect(ret).toEqual([
      'value2',
      'value3',
      'value2',
      'value1',
      'value1',
      'value2',
    ]);
  });

  it('should not remove not use defaul values when do not receive options', () => {
    const transformer = getArrayTransformer();
    const ret = transformer(null);
    expect(ret).toEqual([]);
  });

  it('should not remove duplicated values when receive duplicated default values', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['repeated', 'repeated'],
      removeDuplicated: false,
    });
    const ret = transformer(null);
    expect(ret).toEqual(['repeated', 'repeated']);
  });

  it('should remove duplicated values when receive duplicated default values', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['repeated', 'repeated'],
      removeDuplicated: true,
    });
    const ret = transformer(null);
    expect(ret).toEqual(['repeated']);
  });

  it('should ignore null defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: null,
      removeDuplicated: true,
    });
    const ret = transformer([]);
    expect(ret).toEqual([]);
  });

  it('should ignore undefined defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: undefined,
      removeDuplicated: true,
    });
    const ret = transformer([]);
    expect(ret).toEqual([]);
  });

  it('should ignore empty defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: [],
      removeDuplicated: true,
    });
    const ret = transformer([]);
    expect(ret).toEqual([]);
  });

  it('should transform commma separated values string into array', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: true,
    });
    const ret = transformer('value2,invalid,value3');
    expect(ret).toEqual(['value2', 'invalid', 'value3']);
  });

  it('should transform commma separated values string into array when receives defaultValue param', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer('value2,invalid,value3');
    expect(ret).toEqual(['value2', 'invalid', 'value3']);
  });

  it('should transform string without commas into array containing the same string', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer('value2');
    expect(ret).toEqual(['value2']);
  });

  it('should transform string without commas into array containing the same string when receives defaultValue param', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer('value2');
    expect(ret).toEqual(['value2']);
  });

  it('should transform empty string into array empty array', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: true,
    });
    const ret = transformer('');
    expect(ret).toEqual([]);
  });

  it('should transform empty string into array with defaultValues', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer('');
    expect(ret).toEqual(['default value']);
  });

  it('should transform non string into array containing the non string', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: true,
    });
    const ret = transformer(true);
    expect(ret).toEqual([true]);
  });

  it('should transform non string into array containing the non string when receives defaultValues param', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer(true);
    expect(ret).toEqual([true]);
  });

  it('should transform "," into ["", ""] when receives remove removeDuplicated=false', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: false,
    });
    const ret = transformer(',');
    expect(ret).toEqual(['', '']);
  });

  it('should transform "," into [""] when receives removeDuplicated=true', () => {
    const transformer = getArrayTransformer({
      removeDuplicated: true,
    });
    const ret = transformer(',');
    expect(ret).toEqual(['']);
  });

  it('should transform "," into [""] when receives defaultValues param and removeDuplicated=true', () => {
    const transformer = getArrayTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer(',');
    expect(ret).toEqual(['']);
  });
});
