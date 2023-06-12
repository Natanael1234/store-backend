import { getJSONTransformer } from './json-transformer';

describe('arrayTransformer', () => {
  it('should be defined', () => {
    expect(getJSONTransformer).toBeDefined();
  });

  it('should return a function', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    expect(transformer).toBeDefined();
    expect(typeof transformer).toEqual('function');
  });

  it('should return null when receives null', () => {
    const transformer = getJSONTransformer({});
    expect(transformer(null)).toEqual(null);
  });

  it('should return undefined when receives undefined', () => {
    const transformer = getJSONTransformer({});
    expect(transformer(undefined)).toEqual(undefined);
  });

  it('should return array with default values when receives null and defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
    });
    expect(transformer(null)).toEqual(['default value']);
  });

  it('should return array with default values when receives undefined and defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
    });
    expect(transformer(undefined)).toEqual(['default value']);
  });

  it('should [] when receives []', () => {
    const transformer = getJSONTransformer();
    expect(transformer([])).toEqual([]);
  });

  it('should return [] when receives [], defaultValues and not useDefaulValuesInsteadOfEmptyArray', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['value 1', 'value 2'],
    });
    expect(transformer([])).toEqual([]);
  });

  it('should return default values when receives [], defaltValues and useDefaulValuesInsteadOfEmptyArray=true', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['value 1', 'value 2'],
      useDefaulValuesInsteadOfEmptyArray: true,
    });
    expect(transformer([])).toEqual(['value 1', 'value 2']);
  });

  it('should return [] default values when receives [], defaultVAlues and useDefaulValuesInsteadOfEmptyArray=false', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['value 1', 'value 2'],
      useDefaulValuesInsteadOfEmptyArray: false,
    });
    expect(transformer([])).toEqual([]);
  });

  it('should accepts multiple default values into array with defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value 1', 'default value 2'],
    });
    const ret = transformer(null);
    expect(ret).toEqual(['default value 1', 'default value 2']);
  });

  it('should keep order', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer(['value2', 'value3', 'value1']);
    expect(ret).toEqual(['value2', 'value3', 'value1']);
  });

  it('should remove duplicated values when removeDuplicated option is true', () => {
    const transformer = getJSONTransformer({
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

  it('should not remove duplicated values when removeDuplicated option is false', () => {
    const transformer = getJSONTransformer({
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

  it('should not remove duplicated values when do not receives removeDuplicated option', () => {
    const transformer = getJSONTransformer({
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

  it('should not remove duplicated values when do not receive options', () => {
    const transformer = getJSONTransformer();
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

  it('should not use default values when do not receive options', () => {
    const transformer = getJSONTransformer();
    const ret = transformer(null);
    expect(ret).toEqual(null);
  });

  it('should not remove duplicated values when receives duplicated default values and removeDuplicated is not defined', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['repeated', 'repeated'],
    });
    const ret = transformer(null);
    expect(ret).toEqual(['repeated', 'repeated']);
  });

  it('should not remove duplicated values when receives duplicated default values and removeDuplicated=false', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['repeated', 'repeated'],
      removeDuplicated: false,
    });
    const ret = transformer(null);
    expect(ret).toEqual(['repeated', 'repeated']);
  });

  it('should remove duplicated values when receives duplicated default values and removeDuplicated=true', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['repeated', 'repeated'],
      removeDuplicated: true,
    });
    const ret = transformer(null);
    expect(ret).toEqual(['repeated']);
  });

  it('should ignore null defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: null,
      removeDuplicated: true,
    });
    const ret = transformer(undefined);
    expect(ret).toEqual(undefined);
  });

  it('should ignore undefined defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: undefined,
      removeDuplicated: true,
    });
    const ret = transformer(null);
    expect(ret).toEqual(null);
  });

  it('should transform valid json array string into array', () => {
    const transformer = getJSONTransformer({ removeDuplicated: true });
    const ret = transformer('["value2","invalid","value3"]');
    expect(ret).toEqual(['value2', 'invalid', 'value3']);
  });

  it('should transform valid json string array into json when receives defaultValue param', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
    });
    const ret = transformer('["value2","invalid","value3"]');
    expect(ret).toEqual(['value2', 'invalid', 'value3']);
  });

  it('should transform valid json string object into object', async () => {
    const transformer = getJSONTransformer({ removeDuplicated: true });
    const ret = transformer(
      '{"prop1": "value", "prop2": null, "prop3": true, "prop4": 3, "prop4": "4" }',
    );
    expect(ret).toEqual({
      prop1: 'value',
      prop2: null,
      prop3: true,
      prop4: '4',
    });
  });

  it('should transform "" into undefined', () => {
    const transformer = getJSONTransformer({
      removeDuplicated: true,
    });
    const ret = transformer('');
    expect(ret).toEqual(undefined);
  });

  it('should transform "" into default values when receives defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
    });
    const ret = transformer('');
    expect(ret).toEqual(['default value']);
  });

  it('should transform "" into default values hen receives defaultValues and useDefaulValuesInsteadOfEmptyArray=true', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
      removeDuplicated: true,
      useDefaulValuesInsteadOfEmptyArray: true,
    });
    const ret = transformer('');
    expect(ret).toEqual(['default value']);
  });

  it('should transform "null" into null', () => {
    const transformer = getJSONTransformer({ removeDuplicated: true });
    const ret = transformer('null');
    expect(ret).toEqual(null);
  });

  it('should not transform "undefined"', () => {
    const transformer = getJSONTransformer({ removeDuplicated: true });
    const ret = transformer('undefined');
    expect(ret).toEqual('undefined');
  });

  it('should not transform "null" into default values when receives defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
    });
    const ret = transformer('null');
    expect(ret).toEqual(['default value']);
  });

  it('should not transform "undefined" even when receives defaultValues', () => {
    const transformer = getJSONTransformer({
      defaultValues: ['default value'],
    });
    const ret = transformer('undefined');
    expect(ret).toEqual('undefined');
  });

  it('should return the received value when it has invalid type', () => {
    const transformer = getJSONTransformer({
      removeDuplicated: true,
    });
    const ret = transformer(true);
    expect(ret).toEqual(true);
  });

  it('should return invalid json string when receives invalid json string', async () => {
    const transformer = getJSONTransformer({
      removeDuplicated: true,
    });
    const ret = transformer(true);
    expect(ret).toEqual(true);
  });
});
