import { v4 as uuidv4 } from 'uuid';
import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { CategoryConfigs } from '../../configs/category/category.configs';
import { UpdateCategoryRequestDTO } from './update-category.request.dto';

const NameMessage = new TextMessage('name', {
  minLength: CategoryConfigs.NAME_MIN_LENGTH,
  maxLength: CategoryConfigs.NAME_MAX_LENGTH,
});
const ActiveMessage = new BoolMessage('active');
const ParentIdMessage = new UuidMessage('parent id');

async function testAccept(data: {
  name: string;
  active?: boolean;
  parentId?: string;
}) {
  const errors = await validateFirstError(data, UpdateCategoryRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(
  property: string,
  data: { name: string; active?: boolean; parentId?: string },
  expectedErrors,
) {
  const errors = await validateFirstError(data, UpdateCategoryRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

describe('UpdateCategoryRequestDTO', () => {
  it('should pass validation', async () => {
    const brandData = [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    ];

    const errors = await validateFirstError(
      brandData[0],
      UpdateCategoryRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it(`should accept when name has min length`, async () => {
      await testAccept({ name: 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH) });
    });

    it(`should accept when name has max length`, async () => {
      await testAccept({ name: 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH) });
    });

    it(`should accept when name is undefined`, async () => {
      await testAccept({ name: undefined });
    });

    it('should reject when name is number', async () => {
      await testReject(
        'name',
        { name: 2323232 as unknown as string },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is boolean', async () => {
      await testReject(
        'name',
        { name: true as unknown as string },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is array', async () => {
      await testReject(
        'name',
        { name: [] as unknown as string },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is object', async () => {
      await testReject(
        'name',
        { name: {} as unknown as string },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is empty', async () => {
      await testReject('name', { name: '' }, { isText: NameMessage.MIN_LEN });
    });

    it('should reject when name is too short', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH - 1) },
        { isText: NameMessage.MIN_LEN },
      );
    });

    it('should reject when name is too long', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH + 1) },
        { isText: NameMessage.MAX_LEN },
      );
    });

    it('should reject when name is null', async () => {
      await testReject('name', { name: null }, { isText: NameMessage.NULL });
    });
  });

  describe('active', () => {
    it('should accept when active is true', async () => {
      await testAccept({ name: 'Category name', active: true });
    });

    it('should accept when active is false', async () => {
      await testAccept({ name: 'Category name', active: false });
    });

    it('should accept when active is undefined', async () => {
      await testAccept({ name: 'Category name', active: undefined });
    });

    it('should reject when active is null', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: null },
        { isBool: ActiveMessage.NULL },
      );
    });

    it('should reject when active is number', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: 1 as unknown as boolean },
        { isBool: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is string', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: 'true' as unknown as boolean },
        { isBool: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: [] as unknown as boolean },
        { isBool: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is object', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: {} as unknown as boolean },
        { isBool: ActiveMessage.INVALID },
      );
    });
  });

  describe('parentId', () => {
    it('should validate when parentId is valid', async () => {
      await testAccept({
        name: 'Category 1',
        active: false,
        parentId: uuidv4(),
      });
    });

    it('should validate when parentId is undefined', async () => {
      await testAccept({
        name: 'Category 1',
        active: false,
        parentId: undefined,
      });
    });

    it('should validate when parentId is null', async () => {
      await testAccept({
        name: 'Category 1',
        active: false,
        parentId: null,
      });
    });
    it('should reject when parentId is number', async () => {
      await testReject(
        'parentId',
        {
          name: 'Category 1',
          active: false,
          parentId: 1 as unknown as string,
        },
        { isUuid: ParentIdMessage.STRING },
      );
    });

    it('should reject when parentId is boolean', async () => {
      await testReject(
        'parentId',
        {
          name: 'Category 1',
          active: false,
          parentId: true as unknown as string,
        },
        { isUuid: ParentIdMessage.STRING },
      );
    });

    it('should reject when parentId is invalid string', async () => {
      await testReject(
        'parentId',
        { name: 'Category 1', active: false, parentId: 'not-a-valid-uuid' },
        { isUuid: ParentIdMessage.INVALID },
      );
    });

    it('should reject when parentId is array', async () => {
      await testReject(
        'parentId',
        {
          name: 'Category 1',
          active: false,
          parentId: [] as unknown as string,
        },
        { isUuid: ParentIdMessage.STRING },
      );
    });

    it('should reject when parentId is object', async () => {
      await testReject(
        'parentId',
        {
          name: 'Category 1',
          active: false,
          parentId: {} as unknown as string,
        },
        { isUuid: ParentIdMessage.STRING },
      );
    });
  });
});
