import { plainToInstance } from 'class-transformer';
import { SortMessage } from '../../messages/sort/sort.messages.enum';
import { validateFirstError } from '../../utils/validation/validation';
import { Sort } from './sort.decorator';

enum TestEnum {
  A_ASC = 'a_asc',
  B_ASC = 'b_asc',
  A_DESC = 'a_desc',
  B_DESC = 'b_desc',
}

async function testAccept(
  options,
  data: { orderBy: string[] },
  expectedData: { orderBy: string[] },
) {
  class Clazz {
    @Sort(TestEnum, options) orderBy: TestEnum[];
  }
  const errors = await validateFirstError(data, Clazz);
  expect(errors).toHaveLength(0);
  const dto = plainToInstance(Clazz, data);
  expect(dto).toEqual(expectedData);
}

async function testReject(
  options,
  data: { orderBy: string[] },
  expectedData: { orderBy: string[] },
  constraints,
) {
  class Clazz {
    @Sort(TestEnum, options) orderBy: TestEnum[];
  }
  const errors = await validateFirstError(data, Clazz);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual('orderBy');
  expect(errors[0].value).toEqual(expectedData.orderBy);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('Sort decorator', () => {
  it('should be defined', () => {
    expect(Sort).toBeDefined();
  });

  // valid

  it('should accept a valid value', async () => {
    await testAccept(
      null,
      { orderBy: [TestEnum.B_ASC] },
      { orderBy: [TestEnum.B_ASC] },
    );
  });

  it('should accept multiple sort different values', async () => {
    await testAccept(
      null,
      { orderBy: [TestEnum.B_ASC, TestEnum.A_DESC] },
      { orderBy: [TestEnum.B_ASC, TestEnum.A_DESC] },
    );
  });

  it('should not use defaultValues when a valid value is defined', async () => {
    await testAccept(
      { defaultValues: [TestEnum.A_ASC] },
      { orderBy: [TestEnum.A_DESC] },
      { orderBy: [TestEnum.A_DESC] },
    );
  });

  // null

  describe('null', () => {
    it('should accept null', async () => {
      await testAccept({}, { orderBy: null }, { orderBy: null });
    });

    it('should use defaultValues instead null', async () => {
      await testAccept(
        { defaultValues: [TestEnum.A_ASC] },
        { orderBy: null },
        { orderBy: [TestEnum.A_ASC] },
      );
    });
  });

  // undefined

  describe('undefined', () => {
    it('should accept undefined', async () => {
      await testAccept({}, { orderBy: undefined }, { orderBy: undefined });
    });

    it('should use defaultValues instead undefined', async () => {
      await testAccept(
        { defaultValues: [TestEnum.A_ASC] },
        { orderBy: undefined },
        { orderBy: [TestEnum.A_ASC] },
      );
    });
  });

  // empty array

  describe('empty array', () => {
    it('should accept empty array', async () => {
      await testAccept({}, { orderBy: [] }, { orderBy: [] });
    });

    it('should use defaultValues instead empty array', async () => {
      await testAccept(
        { defaultValues: [TestEnum.A_ASC] },
        { orderBy: [] },
        { orderBy: [TestEnum.A_ASC] },
      );
    });
  });

  // invalid value

  describe('number', () => {
    it('should reject number', async () => {
      await testReject(
        {},
        { orderBy: 1 as unknown as TestEnum[] },
        { orderBy: 1 as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValuesinstead number', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: 1 as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('boolean', () => {
    it('should reject boolean', async () => {
      await testReject(
        {},
        { orderBy: true as unknown as TestEnum[] },
        { orderBy: true as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should accept boolean', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: true as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('string', () => {
    it('should reject string', async () => {
      await testReject(
        {},
        { orderBy: '[]' as unknown as TestEnum[] },
        { orderBy: '[]' as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValuesinstead string', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: '[]' as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('object', () => {
    it('should reject object', async () => {
      await testReject(
        {},
        { orderBy: {} as unknown as TestEnum[] },
        { orderBy: {} as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValues instead instead object', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: [] as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  // invalid items

  describe('boolean item', () => {
    it('should reject array containing boolean', async () => {
      await testReject(
        {},
        { orderBy: [true] as unknown as TestEnum[] },
        { orderBy: [true] as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValues instead array containing boolean', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: [1] as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('number item', () => {
    it('should reject array containing number', async () => {
      await testReject(
        {},
        { orderBy: [1] as unknown as TestEnum[] },
        { orderBy: [1] as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValues instead array containing number', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: [1] as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('array item', () => {
    it('should reject array containing array', async () => {
      await testReject(
        {},
        { orderBy: [[]] as unknown as TestEnum[] },
        { orderBy: [[]] as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValues array containing array', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: [[]] as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('object item', () => {
    it('should reject array containing object', async () => {
      await testReject(
        {},
        { orderBy: [{}] as unknown as TestEnum[] },
        { orderBy: [{}] as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValues instead array containing object', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: [{}] as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('invalid string item', () => {
    it('should reject array containing invalid string', async () => {
      await testReject(
        {},
        { orderBy: ['invalid_asc'] as unknown as TestEnum[] },
        { orderBy: ['invalid_asc'] as unknown as TestEnum[] },
        { isSorting: SortMessage.INVALID },
      );
    });

    it('should use defaultValues instead array containing invalid string', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: ['invalid_asc'] as unknown as TestEnum[] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  // repated items

  describe('repaated items (same column and order)', () => {
    it('should reject repeated values', async () => {
      await testReject(
        {},
        { orderBy: [TestEnum.A_ASC, TestEnum.A_ASC] },
        { orderBy: [TestEnum.A_ASC, TestEnum.A_ASC] },
        { isSorting: SortMessage.REPEATED },
      );
    });

    it('should use defaultValues instead repeated values', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: [TestEnum.A_ASC, TestEnum.A_ASC] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  describe('repated items (same column and different order)', () => {
    it('should reject repeated values', async () => {
      await testReject(
        {},
        { orderBy: [TestEnum.A_ASC, TestEnum.A_DESC] },
        { orderBy: [TestEnum.A_ASC, TestEnum.A_DESC] },
        { isSorting: SortMessage.REPEATED },
      );
    });

    it('should use defaultValues instead repeated values', async () => {
      await testAccept(
        { defaultValues: [TestEnum.B_DESC] },
        { orderBy: [TestEnum.A_ASC, TestEnum.A_DESC] },
        { orderBy: [TestEnum.B_DESC] },
      );
    });
  });

  // options

  describe('options', () => {
    it('should ignore null options', async () => {
      await testAccept(null, { orderBy: [] }, { orderBy: [] });
    });

    it('should ignore undefined options', async () => {
      await testAccept(undefined, { orderBy: [] }, { orderBy: [] });
    });
  });

  // defaultValues

  describe('defaultValues', () => {
    it('should accept empty defaultValues', async () => {
      await testAccept(
        { defaultValues: [] },
        { orderBy: null },
        { orderBy: [] },
      );
    });

    it('should ignore null defaultValues', async () => {
      await testAccept(
        { defaultValues: null },
        { orderBy: [] },
        { orderBy: [] },
      );
    });

    it('should ignore null defaultValues', async () => {
      await testAccept(
        { defaultValues: undefined },
        { orderBy: [] },
        { orderBy: [] },
      );
    });
  });
});
