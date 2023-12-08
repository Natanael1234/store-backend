import { plainToInstance } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import { IdListMessage } from '../../messages/id-list/id-list.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { IsUuidListConstrantOptions, UuidList } from './uuid-list.decorator';

function getClazz(decoratorOptions: IsUuidListConstrantOptions) {
  class Clazz {
    @UuidList(decoratorOptions) testIds: number[];
  }
  return Clazz;
}

async function testAccept(
  options: IsUuidListConstrantOptions,
  data: { testIds?: string[] },
  expectedData: { testIds?: string[] },
) {
  const errors = await validateFirstError(data, getClazz(options));
  expect(errors).toHaveLength(0);
  const Clazz = getClazz(options);
  const dto = plainToInstance(Clazz, data);
  expect(dto).toEqual(expectedData);
}

async function testReject(
  options: IsUuidListConstrantOptions,
  data: { testIds: string[] },
  expectedData: { testIds: string[] },
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
    expect(typeof UuidList()).toEqual('function');
  });

  // valid

  it('should accept valid array of ids', async () => {
    const testIds = [uuidv4(), uuidv4()];
    await testAccept({ label: 'test ids' }, { testIds }, { testIds });
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
      { isUuidList: Message.NULL },
    );
  });

  it('should reject null when allowNull = null', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNull: null },
      { testIds: null },
      { testIds: null },
      { isUuidList: Message.NULL },
    );
  });

  it('should reject null when allowNull = undefined', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNull: undefined },
      { testIds: null },
      { testIds: null },
      { isUuidList: Message.NULL },
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
      { isUuidList: Message.REQUIRED },
    );
  });

  it('should reject undefined when allowUndefined = null', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowUndefined: null },
      { testIds: undefined },
      { testIds: undefined },
      { isUuidList: Message.REQUIRED },
    );
  });

  it('should reject undefined when allowUndefined = undefined', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowUndefined: undefined },
      { testIds: undefined },
      { testIds: undefined },
      { isUuidList: Message.REQUIRED },
    );
  });

  // min length

  it('should accept empty array when minLength is not defined', async () => {
    await testAccept({ label: 'test ids' }, { testIds: [] }, { testIds: [] });
  });

  it('should accept minimum length when minLength is defined', async () => {
    const testIds = [uuidv4(), uuidv4()];
    await testAccept(
      { label: 'test ids', minLength: 2, maxLength: 4 },
      { testIds },
      { testIds },
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
      { isUuidList: Message.MIN_LEN },
    );
  });

  it('should reject less than minimum length when minLength greater than 1', async () => {
    const Message = new IdListMessage('test ids', {
      minLength: 2,
      maxLength: 4,
    });
    const testIds = [uuidv4()];
    await testReject(
      { label: 'test ids', minLength: 2 },
      { testIds },
      { testIds },
      { isUuidList: Message.MIN_LEN },
    );
  });

  // max length

  it('should accept maximum length when maxLength is defined', async () => {
    const testIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    await testAccept(
      { label: 'test ids', minLength: 2, maxLength: 4 },
      { testIds },
      { testIds },
    );
  });

  it('should reject more than maximum length when maxLength is 1', async () => {
    const Message = new IdListMessage('test ids', {
      minLength: 0,
      maxLength: 1,
    });
    const testIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    await testReject(
      { label: 'test ids', minLength: 0, maxLength: 1 },
      { testIds },
      { testIds },
      { isUuidList: Message.MAX_LEN },
    );
  });

  it('should reject more than maximum length when maxLength is greater than 1', async () => {
    const Message = new IdListMessage('test ids', {
      minLength: 2,
      maxLength: 4,
    });
    const testIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    await testReject(
      { label: 'test ids', minLength: 2, maxLength: 4 },
      { testIds },
      { testIds },
      { isUuidList: Message.MAX_LEN },
    );
  });

  // invalid

  it('should reject number', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: 1 as unknown as any[] },
      { testIds: 1 as unknown as any[] },
      { isUuidList: Message.INVALID },
    );
  });

  it('should reject boolean', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: true as unknown as any[] },
      { testIds: true as unknown as any[] },
      { isUuidList: Message.INVALID },
    );
  });

  it('should reject string', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: '[]' as unknown as any[] },
      { testIds: '[]' as unknown as any[] },
      { isUuidList: Message.INVALID },
    );
  });

  it('should reject object', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: {} as unknown as any[] },
      { testIds: {} as unknown as any[] },
      { isUuidList: Message.INVALID },
    );
  });

  // invalid item

  it('should reject number item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [1] as unknown as any[] },
      { testIds: [1] as unknown as any[] },
      { isUuidList: Message.ITEM_INVALID },
    );
  });

  it('should reject boolean item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [true] as unknown as any[] },
      { testIds: [true] as unknown as any[] },
      { isUuidList: Message.ITEM_INVALID },
    );
  });

  it('should reject invalid string item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: ['not-a-valid-uuid'] as unknown as any[] },
      { testIds: ['not-a-valid-uuid'] as unknown as any[] },
      { isUuidList: Message.ITEM_INVALID },
    );
  });

  it('should reject array item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [[]] as unknown as any[] },
      { testIds: [[]] as unknown as any[] },
      { isUuidList: Message.ITEM_INVALID },
    );
  });

  it('should reject object item', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids' },
      { testIds: [{}] as unknown as any[] },
      { testIds: [{}] as unknown as any[] },
      { isUuidList: Message.ITEM_INVALID },
    );
  });

  it('should reject when item is undefined', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNullItem: false },
      { testIds: [undefined] },
      { testIds: [undefined] },
      { isUuidList: Message.ITEM_INVALID },
    );
  });

  it('should reject null item when not allowed', async () => {
    const Message = new IdListMessage('test ids');
    await testReject(
      { label: 'test ids', allowNullItem: false },
      { testIds: [null] },
      { testIds: [null] },
      { isUuidList: Message.ITEM_INVALID },
    );
  });

  it('should accept null item when allowed', async () => {
    await testAccept(
      { label: 'test ids', allowNullItem: true },
      { testIds: [null] },
      { testIds: [null] },
    );
  });

  // repeated items

  it('should remove repeated items', async () => {
    const id1 = uuidv4();
    const id2 = uuidv4();
    const id3 = uuidv4();
    const id4 = uuidv4();
    const testIds = [id1, id1, null, id2, id3, null, id3, id4];
    const testIdsNonREpeated = [...new Set(testIds)];
    await testAccept(
      { label: 'test ids', allowNullItem: true },
      { testIds },
      { testIds: testIdsNonREpeated },
    );
  });
});
