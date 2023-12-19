import { plainToInstance } from 'class-transformer';
import { IdListConfigs } from '../../configs/id-list/id-list.configs';
import { IdListMessage } from '../../messages/id-list/id-list.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { IdList, IsIdListConstrantOptions } from './id-list.decorator';

function getClazz(decoratorOptions: IsIdListConstrantOptions) {
  class Clazz {
    @IdList(decoratorOptions) testIds: number[];
  }
  return Clazz;
}

async function testAccept(
  options: IsIdListConstrantOptions,
  data: { testIds?: number[] },
  expectedData: { testIds?: number[] },
) {
  const errors = await validateFirstError(data, getClazz(options));
  expect(errors).toHaveLength(0);
  const Clazz = getClazz(options);
  const dto = plainToInstance(Clazz, data);
  expect(dto).toEqual(expectedData);
}

async function testReject(
  options: IsIdListConstrantOptions,
  data: { testIds: number[] },
  expectedData: { testIds: number[] },
  constraints: any,
) {
  const errors = await validateFirstError(data, getClazz(options));
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual('testIds');
  expect(errors[0].target).toEqual(data);
  expect(errors[0].value).toEqual(expectedData.testIds);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('IdList decorator', () => {
  it('should return a function', () => {
    expect(typeof IdList()).toEqual('function');
  });

  // valid

  it('should accept valid array of ids', async () => {
    await testAccept(
      { label: 'test ids' },
      { testIds: [1, 2] },
      { testIds: [1, 2] },
    );
  });

  // null

  it('should accept null when allowNull = true', async () => {
    await testAccept(
      { label: 'test ids', allowNull: true },
      { testIds: null },
      { testIds: null },
    );
  });

  it('should reject null when allowNull = false', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNull: false },
      { testIds: null },
      { testIds: null },
      { isIdList: Message.NULL },
    );
  });

  it('should reject null when allowNull = null', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNull: null },
      { testIds: null },
      { testIds: null },
      { isIdList: Message.NULL },
    );
  });

  it('should reject null when allowNull = undefined', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNull: undefined },
      { testIds: null },
      { testIds: null },
      { isIdList: Message.NULL },
    );
  });

  // undefined

  it('should accept undefined when allowUndefined = true', async () => {
    await testAccept(
      { label: 'test ids', allowUndefined: true },
      { testIds: undefined },
      { testIds: undefined },
    );
  });

  it('should reject undefined when allowUndefined = false', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowUndefined: false },
      { testIds: undefined },
      { testIds: undefined },
      { isIdList: Message.REQUIRED },
    );
  });

  it('should reject undefined when allowUndefined = null', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowUndefined: null },
      { testIds: undefined },
      { testIds: undefined },
      { isIdList: Message.REQUIRED },
    );
  });

  it('should reject undefined when allowUndefined = undefined', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowUndefined: undefined },
      { testIds: undefined },
      { testIds: undefined },
      { isIdList: Message.REQUIRED },
    );
  });

  // min length

  it('should accept empty array when minLength is not defined', async () => {
    await testAccept({ label: 'test ids' }, { testIds: [] }, { testIds: [] });
  });

  it('should accept minimum length when minLength is defined', async () => {
    await testAccept(
      { label: 'test ids', minLength: 2, maxLength: 4 },
      { testIds: [1, 2] },
      { testIds: [1, 2] },
    );
  });

  it('should reject less than minimum length when minLength is 1', async () => {
    const Message = new IdListMessage('test ids', {
      minLength: 1,
      maxLength: 4,
    });
    await testReject(
      { label: 'test ids', minLength: 1, maxLength: 4 },
      { testIds: [] },
      { testIds: [] },
      { isIdList: Message.MIN_LEN },
    );
  });

  it('should reject less than minimum length when minLength greater than 1', async () => {
    const Message = new IdListMessage('test ids', {
      minLength: 2,
      maxLength: 4,
    });
    await testReject(
      { label: 'test ids', minLength: 2 },
      { testIds: [1] },
      { testIds: [1] },
      { isIdList: Message.MIN_LEN },
    );
  });

  // max length

  it('should accept large array when maxLength is not defined', async () => {
    const testIds = [...Array(1000).keys()].map((i) => i + 1);
    await testAccept({ label: 'test ids' }, { testIds }, { testIds });
  });

  it('should accept maximum length when maxLength is defined', async () => {
    await testAccept(
      { label: 'test ids', minLength: 2, maxLength: 4 },
      { testIds: [1, 2, 3, 5] },
      { testIds: [1, 2, 3, 5] },
    );
  });

  it('should reject more than maximum length when maxLength is 1', async () => {
    const Message = new IdListMessage('test ids', {
      minLength: 0,
      maxLength: 1,
    });
    await testReject(
      { label: 'test ids', minLength: 0, maxLength: 1 },
      { testIds: [1, 2, 3, 4, 5] },
      { testIds: [1, 2, 3, 4, 5] },
      { isIdList: Message.MAX_LEN },
    );
  });

  it('should reject more than maximum length when maxLength is greater than 1', async () => {
    const Message = new IdListMessage('test ids', {
      minLength: 2,
      maxLength: 4,
    });
    await testReject(
      { label: 'test ids', minLength: 2, maxLength: 4 },
      { testIds: [1, 2, 3, 4, 5] },
      { testIds: [1, 2, 3, 4, 5] },
      { isIdList: Message.MAX_LEN },
    );
  });

  // invalid

  it('should reject number', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: 1 as unknown as any[] },
      { testIds: 1 as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject boolean', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: true as unknown as any[] },
      { testIds: true as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject string', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: '[]' as unknown as any[] },
      { testIds: '[]' as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject object', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: {} as unknown as any[] },
      { testIds: {} as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  // invalid item

  it('should reject boolean item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [true] as unknown as any[] },
      { testIds: [true] as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject string item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: ['1'] as unknown as any[] },
      { testIds: ['1'] as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject array item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [[]] as unknown as any[] },
      { testIds: [[]] as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject object item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [{}] as unknown as any[] },
      { testIds: [{}] as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should accept minimum id', async () => {
    await testAccept(
      { label: 'test ids' },
      { testIds: [IdListConfigs.MIN_ID] },
      { testIds: [IdListConfigs.MIN_ID] },
    );
  });

  it('should reject when item is lower than allowed', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [IdListConfigs.MIN_ID - 1] as unknown as any[] },
      { testIds: [IdListConfigs.MIN_ID - 1] as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject when item is undefined', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNullItem: false },
      { testIds: [undefined] },
      { testIds: [undefined] },
      { isIdList: Message.INVALID },
    );
  });

  it('should reject null item when not allowed', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNullItem: false },
      { testIds: [null] },
      { testIds: [null] },
      { isIdList: Message.INVALID },
    );
  });

  it('should accept null item when allowed', async () => {
    await testAccept(
      { label: 'test ids', allowNullItem: true },
      { testIds: [null] },
      { testIds: [null] },
    );
  });

  it('should accept maximum id', async () => {
    await testAccept(
      { label: 'test ids' },
      { testIds: [IdListConfigs.MAX_ID] },
      { testIds: [IdListConfigs.MAX_ID] },
    );
  });

  it('should reject when item is greater than allowed', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [IdListConfigs.MAX_ID + 1] as unknown as any[] },
      { testIds: [IdListConfigs.MAX_ID + 1] as unknown as any[] },
      { isIdList: Message.INVALID },
    );
  });

  // repeated items

  it('should remove repeated items', async () => {
    await testAccept(
      { label: 'test ids', allowNullItem: true },
      { testIds: [1, 1, null, 2, 3, null, 3, 4] },
      { testIds: [1, null, 2, 3, 4] },
    );
  });
});
