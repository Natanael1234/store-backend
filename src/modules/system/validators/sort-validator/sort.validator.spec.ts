import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SortMessage } from '../../enums/messages/sort-messages/sort-messages.enum';
import { IsSorting } from './sort.validator';

enum TestEnum {
  value1 = 'value1',
  value2 = 'value2',
  value3 = 'value3',
}

describe('IsSorting', () => {
  it('should be defined', () => {
    expect(IsSorting).toBeDefined();
  });

  it('should return a function', () => {
    expect(typeof IsSorting(TestEnum)).toEqual('function');
  });

  describe('array', () => {
    it('should validate when receives empty array', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, {
        test: [],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate when receives null intead of array', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: null });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate when receives undefined intead of array', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: undefined });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should not validate when receives invalid parameter type intead of array', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: {} });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isSorting).toEqual(SortMessage.INVALID);
      expect(errors[0].target).toEqual({ test: {} });
      expect(errors[0].value).toEqual({});
    });
  });

  describe('array items', () => {
    it('should validate when receives array with items of a valid enum', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, {
        test: [TestEnum.value1, TestEnum.value2, TestEnum.value3],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate when receives array with string items equivalent to the values of a valid enum', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, {
        test: [TestEnum.value1, TestEnum.value2, TestEnum.value3],
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should not validate when receives invalid array item string', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: ['invalid'] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isSorting).toEqual(SortMessage.INVALID);
      expect(errors[0].target).toEqual({ test: ['invalid'] });
      expect(errors[0].value).toEqual(['invalid']);
    });

    it('should not validate when receives invalid array item type', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: [true] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isSorting).toEqual(SortMessage.INVALID);
      expect(errors[0].target).toEqual({ test: [true] });
      expect(errors[0].value).toEqual([true]);
    });

    it('should not validate when receives null array item', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: [null] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isSorting).toEqual(SortMessage.INVALID);
      expect(errors[0].target).toEqual({ test: [null] });
      expect(errors[0].value).toEqual([null]);
    });

    it('should not validate when receives undefined array item', async () => {
      class dTO {
        @IsSorting(TestEnum)
        test: TestEnum[];
      }
      const dto = plainToInstance(dTO, { test: [undefined] });
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('test');
      expect(errors[0].constraints.isSorting).toEqual(SortMessage.INVALID);
      expect(errors[0].target).toEqual({ test: [undefined] });
      expect(errors[0].value).toEqual([undefined]);
    });
  });
});
