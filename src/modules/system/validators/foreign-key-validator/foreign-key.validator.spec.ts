import { validate } from 'class-validator';
import { IsForeignKey } from './foreign-key.validator';

function getClazz(options?: {
  allowUndefined?: boolean;
  allowNull?: boolean;
  customPropertyName?;
  requiredMessage?;
  notNullMessage?;
  invalidTypeMessage?;
}) {
  class Clazz {
    @IsForeignKey(options) prop: number;
  }
  return Clazz;
}

function getClazzWithoudOptions() {
  class Clazz {
    @IsForeignKey() prop: number;
  }
  return Clazz;
}

function getNormalizedOptions(options?: {
  allowUndefined?: boolean;
  allowNull?: boolean;
}) {
  return {
    allowUndefined: !!options?.allowUndefined,
    allowNull: !!options?.allowNull,
  };
}

function shouldValidate(options, value) {
  let { allowUndefined, allowNull } = getNormalizedOptions(options);

  if (value === undefined && allowUndefined) {
    return true;
  }
  if (value === null && allowNull) {
    return true;
  }
  return Number.isInteger(value) && value >= 1;
}

function getOptionTest(options?: {
  allowUndefined?: boolean;
  allowNull?: boolean;
}) {
  const Clazz = getClazz(options);
  const normalizedOptions = getNormalizedOptions(options);
  const description = `options=${JSON.stringify(options)}`;
  return {
    description,
    options,
    normalizedOptions,
    Clazz,
    testes: [],
  };
}

function getTests() {
  const results = [];

  const options: any = [
    {
      Clazz: getClazzWithoudOptions(),
      description: 'option is not defined',
      normalizedOptions: getNormalizedOptions(),
    },
    getOptionTest(null),
    getOptionTest(undefined),
    getOptionTest({}),
    getOptionTest({ allowUndefined: false }),
    getOptionTest({ allowNull: false }),
    getOptionTest({ allowUndefined: true }),
    getOptionTest({ allowNull: true }),
    getOptionTest({ allowUndefined: true, allowNull: true }),
    getOptionTest({ allowUndefined: true, allowNull: false }),
    getOptionTest({ allowUndefined: false, allowNull: true }),
    getOptionTest({ allowUndefined: false, allowNull: false }),
  ];

  const tests = [
    { description: 'min valid integer', value: 1 },
    { description: 'under min value', value: 0 },
    { description: 'float', value: 1.1 },
    { description: 'negative', value: -1 },
    { description: 'negative float', value: -1.1 },
    { description: 'undefined', value: undefined },
    { description: 'null', value: null },
    { description: 'invalid type', value: {} },
  ];

  for (let option of options) {
    for (let _test of tests) {
      const shoudReject = !shouldValidate(option.options, _test.value);
      const result = {
        Clazz: option.Clazz,
        description: null,
        value: _test.value,
        shoudReject,
        constraints: null,
        optionsDescription: option.description,
        testDescription: _test.description,
      };

      if (!shoudReject) {
        result.description = `should validate when ${option.description} and value is ${_test.description}`;
      } else {
        if (!option.normalizedOptions.allowNull && _test.value === null) {
          result.constraints = { isForeignKey: 'prop is null' };
        } else if (
          !option.normalizedOptions.allowUndefined &&
          _test.value === undefined
        ) {
          result.constraints = { isForeignKey: 'prop is required' };
        } else {
          result.constraints = { isForeignKey: 'prop is invalid' };
        }
        result.description = `should not validate when ${option.description} and value is ${_test.description}`;
      }

      results.push(result);
    }
  }
  const accepts = results.filter((result) => !result.shoudReject);
  const rejects = results.filter((result) => result.shoudReject);
  return { accepts, rejects };
}

const { accepts, rejects } = getTests();

describe('IsForeignKey', () => {
  it('should be defined', () => {
    expect(IsForeignKey).toBeDefined();
  });

  it('should return a function', () => {
    expect(typeof IsForeignKey()).toEqual('function');
  });

  describe.each(accepts)('$optionsDescription', ({ description, Clazz }) => {
    it(`${description}`, async () => {
      const dto = new Clazz();
      dto.prop = 1;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe.each(rejects)(
    '$optionsDescription',
    ({ description, Clazz, constraints, value }) => {
      it(`${description}`, async () => {
        const dto = new Clazz();
        dto.prop = value;
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('prop');
        expect(errors[0].constraints).toEqual(constraints);
        expect(errors[0].target).toEqual({ prop: value });
        expect(errors[0].value).toEqual(value);
      });
    },
  );

  it(`should use customPropertyName`, async () => {
    class Clazz {
      @IsForeignKey({ allowUndefined: false, customPropertyName: 'Product id' })
      prop: number;
    }
    const dto = new Clazz();
    dto.prop = {} as number;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('prop');
    expect(errors[0].constraints).toEqual({
      isForeignKey: 'Product id is invalid',
    });
    expect(errors[0].target).toEqual({ prop: {} });
    expect(errors[0].value).toEqual({});
  });

  it(`should use custom notNullMessage`, async () => {
    class Clazz {
      @IsForeignKey({
        allowUndefined: false,
        requiredMessage: 'Foo is required',
        invalidTypeMessage: 'Foo must be number',
        notNullMessage: 'Foo is null',
      })
      prop: number;
    }
    const dto = new Clazz();
    dto.prop = null;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('prop');
    expect(errors[0].constraints).toEqual({
      isForeignKey: 'Foo is null',
    });
    expect(errors[0].target).toEqual({ prop: null });
    expect(errors[0].value).toEqual(null);
  });

  it(`should use custom requiredMessage and required message`, async () => {
    class Clazz {
      @IsForeignKey({
        allowUndefined: false,
        requiredMessage: 'Foo is required',
        invalidTypeMessage: 'Foo must be number',
        notNullMessage: 'Foo is null',
      })
      prop: number;
    }
    const dto = new Clazz();
    dto.prop = undefined;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('prop');
    expect(errors[0].constraints).toEqual({
      isForeignKey: 'Foo is required',
    });
    expect(errors[0].target).toEqual({ prop: undefined });
    expect(errors[0].value).toEqual(undefined);
  });

  it(`should use custom invalidTypeMessage`, async () => {
    class Clazz {
      @IsForeignKey({
        allowUndefined: false,
        requiredMessage: 'Foo is required',
        invalidTypeMessage: 'Foo must be number',
        notNullMessage: 'Foo is null',
      })
      prop: number;
    }
    const dto = new Clazz();
    dto.prop = {} as number;
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual('prop');
    expect(errors[0].constraints).toEqual({
      isForeignKey: 'Foo must be number',
    });
    expect(errors[0].target).toEqual({ prop: {} });
    expect(errors[0].value).toEqual({});
  });
});
