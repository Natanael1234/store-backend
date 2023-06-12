import { validate } from 'class-validator';
import { IsIdList } from './id-list.validator';

function getDTO(options?: {
  customPropertyName?;
  requiredMessage?;
  notNullMessage?;
  invalidTypeMessage?;
  allowUndefined?: boolean;
  allowNull?: boolean;
  allowNullItem?: boolean;
}) {
  class Clazz {
    @IsIdList(options) prop: number;
  }
  return new Clazz();
}

function getNormalizedOptions(options?: {
  allowUndefined?: boolean;
  allowNull?: boolean;
  allowNullItem?: boolean;
}) {
  return {
    allowUndefined: !!options?.allowUndefined,
    allowNull: !!options?.allowNull,
    allowNullItem: !!options?.allowNullItem,
  };
}

function getConstraints(options, arr) {
  if (arr === undefined && !options?.allowUndefined) {
    return { isIdList: 'prop is required' };
  }
  if (arr === null && !options?.allowNull) {
    return { isIdList: 'Null prop' };
  }
  if (arr != null) {
    if (!Array.isArray(arr)) {
      return { isIdList: 'Invalid prop' };
    }
    for (const item of arr) {
      if (item === null) {
        if (!options?.allowNullItem) {
          return { isIdList: 'prop item cannot be null' };
        }
      } else {
        if (Number.isInteger(item)) {
          if (item < 1) {
            return { isIdList: 'Invalid prop item' };
          }
        } else {
          return { isIdList: 'Invalid prop item' };
        }
      }
    }
  }
  return null;
}

type Options = {
  description: string;
  data: any;
  normalizedData: any;
};
type Test = {
  description: string;
  data: any;
};
type OptionTest = {
  description: string;
  option: Options;
  test: Test;
  constraints: any;
  dto: any;
};
type OptionTestResults = {
  accepts: OptionTest[];
  rejects: OptionTest[];
};

function getTests(): OptionTestResults {
  const results: OptionTestResults = {
    accepts: [],
    rejects: [],
  };
  const options: Options[] = [
    // allowUndefined
    {
      description: 'options has no properties defined',
      data: {},
    },
    {
      description: '"allowUndefined" is undefined',
      data: { allowUndefined: undefined },
    },
    {
      description: '"allowUndefined" is null',
      data: { allowUndefined: null },
    },
    {
      description: '"allowUndefined" is true',
      data: { allowUndefined: true },
    },
    {
      description: '"allowUndefined" is false',
      data: { allowUndefined: false },
    },
    // allowNull
    {
      description: '"allowNull" is not defined',
      data: {},
    },
    {
      description: '"allowNull" is undefined',
      data: { allowNull: undefined },
    },
    {
      description: '"allowNull" is null',
      data: { allowNull: null },
    },
    {
      description: '"allowNull" is true',
      data: { allowNull: true },
    },
    {
      description: '"allowNull" is false',
      data: { allowNull: false },
    },
    {
      description: '"allowNull" is not defined',
      data: {},
    },
    // allowNullItem
    {
      description: '"allowNullItem" is undefined',
      data: { allowNullItem: undefined },
    },
    {
      description: '"allowNullItem" is null',
      data: { allowNullItem: null },
    },
    {
      description: '"allowNullItem" is true',
      data: { allowNullItem: true },
    },
    {
      description: '"allowNullItem" is false',
      data: { allowNullItem: false },
    },
    // combinations

    {
      description: 'allowNull and allowUndefined are true',
      data: {
        allowNull: true,
        allowUndefined: true,
        allowNullItem: false,
      },
    },
    {
      description: 'allowNull and allowNullItem are true',
      data: {
        allowNull: true,
        allowUndefined: false,
        allowNullItem: true,
      },
    },
    {
      description: 'allowUndefined and allowNullItem are true',
      data: {
        allowNull: false,
        allowUndefined: true,
        allowNullItem: true,
      },
    },
    {
      description: 'allowNull, allowUndefined and allowNullItem are true',
      data: {
        allowNull: true,
        allowUndefined: true,
        allowNullItem: true,
      },
    },
    {
      description: 'allowNull, allowUndefined and allowNullItem are false',
      data: {
        allowNull: false,
        allowUndefined: false,
        allowNullItem: false,
      },
    },
  ].map((option) => {
    return {
      description: option.description,
      data: option.data,
      normalizedData: getNormalizedOptions(option.data),
    };
  });

  const tests: Test[] = [
    { description: '[]', data: [] },
    { description: '[1]', data: [1] },
    { description: '[0]', data: [0] },
    { description: '[1.1]', data: [1.1] },
    { description: '[-1]', data: [-1] },
    { description: '[-1.1]', data: [-1.1] },

    { description: '[1, 2]', data: [1, 2] },
    { description: '[0, 2]', data: [0, 2] },
    { description: '[1.1, 2]', data: [1.1, 2] },
    { description: '[-1, 2]', data: [-1, 2] },
    { description: '[-1.1, 2]', data: [-1.1, 2] },

    { description: 'undefined', data: undefined },
    { description: 'null', data: null },
    { description: 'invalid type', data: {} },
    { description: 'number string', data: ['1'] },
  ];

  for (let option of options) {
    for (let test of tests) {
      const result: OptionTest = {
        description: null,
        option,
        test,
        dto: getDTO(option.data),
        constraints: getConstraints(option.data, test.data),
      };
      if (!result.constraints) {
        result.description = `should validate when ${option.description} and value is ${test.description}`;
        results.accepts.push(result);
      } else {
        result.description = `should not validate when ${option.description} and value is ${test.description}`;
        results.rejects.push(result);
      }
    }
  }
  return results;
}

const { accepts, rejects } = getTests();

describe('isIdList', () => {
  it('should be defined', () => {
    expect(IsIdList).toBeDefined();
  });

  it('should return a function', () => {
    expect(typeof IsIdList()).toEqual('function');
  });

  it.each(accepts)(`$description`, async ({ test, dto }) => {
    dto.prop = test.data;
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it.each(rejects)(
    `$description`,
    async ({ description, dto, constraints, test }) => {
      dto.prop = test.data;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('prop');
      expect(errors[0].constraints).toEqual(constraints);
      expect(errors[0].target).toEqual({ prop: test.data });
      expect(errors[0].value).toEqual(test.data);
    },
  );

  describe('customPropertyName', () => {
    it.each([
      {
        description: 'required message',
        customPropertyName: 'bar',
        constraints: { isIdList: 'bar is required' },
        data: undefined,
      },
      {
        description: 'null message',
        customPropertyName: 'bar',
        constraints: { isIdList: 'Null bar' },
        data: null,
      },
      {
        description: 'invalid message',
        customPropertyName: 'bar',
        constraints: { isIdList: 'Invalid bar' },
        data: 1,
      },
      {
        description: 'invalid bar item',
        customPropertyName: 'bar',
        constraints: { isIdList: 'Invalid bar item' },
        data: [-1],
      },
      {
        description: 'null or undefined bar item item',
        customPropertyName: 'bar',
        constraints: { isIdList: 'bar items cannot be null' },
        data: [null],
      },
    ])(
      `should use custom propertyName in $description`,
      async ({ customPropertyName: propertyName, data, constraints }) => {
        class Clazz {
          @IsIdList({ customPropertyName: propertyName })
          prop: number;
        }
        const dto = new Clazz();
        dto.prop = data as any;
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('prop');
        expect(errors[0].constraints).toEqual(constraints);
        expect(errors[0].target).toEqual({ prop: data });
        expect(errors[0].value).toEqual(data);
      },
    );
  });

  describe('custom messages', () => {
    class Clazz {
      @IsIdList({
        allowUndefined: false,
        requiredMessage: 'Foo is required',
        invalidMessage: 'Invalid foo',
        notNullMessage: 'Foo is null',

        invalidItemMessage: 'Invalid foo item',
        requiredItemMessage: 'Foo item is required',
      })
      prop: number;
    }
    it.each([
      {
        messageName: 'requiredMessage',
        constraint: { isIdList: 'Foo is required' },
        data: undefined,
      },
      {
        messageName: 'notNullMessage',
        constraint: { isIdList: 'Foo is null' },
        data: null,
      },
      {
        messageName: 'invalidTypeMessage',
        constraint: { isIdList: 'Invalid foo' },
        data: true as any,
      },
      {
        messageName: 'invaliItemMessage',
        constraint: { isIdList: 'Invalid foo item' },
        data: [true],
      },
      {
        messageName: 'requiredItemMessage',
        constraint: { isIdList: 'Foo item is required' },
        data: [null],
      },
    ])(`should use custom $messageName`, async ({ data, constraint }) => {
      const dto = new Clazz();
      dto.prop = data as any;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('prop');
      expect(errors[0].constraints).toEqual(constraint);
      expect(errors[0].target).toEqual({ prop: data });
      expect(errors[0].value).toEqual(data);
    });
  });
});
