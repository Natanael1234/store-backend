import { TestDtoIdListFilter } from '../../../../test/filtering/id-list-filter/test-dto-id-list-filter';
import { validateFirstError } from '../../utils/validation';
import { IsIdListConstrantOptions } from '../../validators/id-list-validator/id-list.validator';
import { IdList } from './id-list.decorator';

function getClazz(decoratorOptions: IsIdListConstrantOptions) {
  class Clazz {
    @IdList(decoratorOptions) ids: number[];
  }
  return Clazz;
}

const { accepts, rejects } = new TestDtoIdListFilter({
  messages: { propertyLabel: 'ids' },
}).getTestData();

describe('IdList decorator', () => {
  it('should be defined', () => {
    expect(IdList).toBeDefined();
  });

  describe.each(accepts)('options=$options.data', ({ test, options }) => {
    it(`should accept and return ${JSON.stringify(
      test.normalizedData,
    )} when value is ${test.description}`, async () => {
      const errors = await validateFirstError(
        { ids: test.data },
        getClazz(options.data),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe.each(rejects)(
    'options=$options.data',
    ({ description, test, options, constraints }) => {
      it(description, async () => {
        const errors = await validateFirstError(
          { ids: test.data },
          getClazz(options.data),
        );
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('ids');
        expect(errors[0].value).toEqual(test.normalizedData);
        expect(errors[0].constraints).toEqual(constraints);
      });
    },
  );

  it('should user custom property label', async () => {
    class Clazz {
      @IdList({
        customPropertyName: 'Prop X',
        allowNull: false,
        allowUndefined: false,
        allowNullItem: false,
      })
      prop: number[];

      constructor(value: any) {
        this.prop = value;
      }
    }

    const validations = [
      await validateFirstError(new Clazz(null), Clazz),
      await validateFirstError(new Clazz(undefined), Clazz),
      await validateFirstError(new Clazz(true), Clazz),
      await validateFirstError(new Clazz([null]), Clazz),
      await validateFirstError(new Clazz([0]), Clazz),
    ];

    expect(validations[0]).toHaveLength(1);
    expect(validations[1]).toHaveLength(1);
    expect(validations[2]).toHaveLength(1);
    expect(validations[3]).toHaveLength(1);
    expect(validations[4]).toHaveLength(1);

    expect(validations[0][0].constraints).toEqual({
      isIdList: 'Null Prop X',
    });
    expect(validations[1][0].constraints).toEqual({
      isIdList: 'Prop X is required',
    });
    expect(validations[2][0].constraints).toEqual({
      isIdList: 'Invalid Prop X',
    });
    expect(validations[3][0].constraints).toEqual({
      isIdList: 'Prop X items cannot be null',
    });
    expect(validations[4][0].constraints).toEqual({
      isIdList: 'Invalid Prop X item',
    });
  });

  it('should user custom message', async () => {
    class Clazz {
      @IdList({
        customPropertyName: 'Prop X',
        allowNull: false,
        allowUndefined: false,
        allowNullItem: false,
        notNullMessage: 'Message 1',
        requiredMessage: 'Message 2',
        invalidMessage: 'Message 3',
        requiredItemMessage: 'Message 4',
        invalidItemMessage: 'Message 5',
      })
      prop: number;

      constructor(value: any) {
        this.prop = value;
      }
    }

    const validations = [
      await validateFirstError(new Clazz(null), Clazz),
      await validateFirstError(new Clazz(undefined), Clazz),
      await validateFirstError(new Clazz(true), Clazz),
      await validateFirstError(new Clazz([null]), Clazz),
      await validateFirstError(new Clazz([0]), Clazz),
    ];

    expect(validations[0]).toHaveLength(1);
    expect(validations[1]).toHaveLength(1);
    expect(validations[2]).toHaveLength(1);
    expect(validations[3]).toHaveLength(1);
    expect(validations[4]).toHaveLength(1);

    expect(validations[0][0].constraints).toEqual({
      isIdList: 'Message 1',
    });
    expect(validations[1][0].constraints).toEqual({
      isIdList: 'Message 2',
    });
    expect(validations[2][0].constraints).toEqual({
      isIdList: 'Message 3',
    });
    expect(validations[3][0].constraints).toEqual({
      isIdList: 'Message 4',
    });
    expect(validations[4][0].constraints).toEqual({
      isIdList: 'Message 5',
    });
  });
});
