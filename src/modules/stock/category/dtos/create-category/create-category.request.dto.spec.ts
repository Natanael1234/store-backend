import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { UuidMessage } from '../../../../system/messages/uuid/uuid.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { CategoryConfigs } from '../../configs/category/category.configs';
import { CreateCategoryRequestDTO } from './create-category.request.dto';

const VALID_UUID = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
const INVALID_UUID = 'not-a-valid-uuid';

const NameMessage = new TextMessage('name', {
  minLength: CategoryConfigs.NAME_MIN_LENGTH,
  maxLength: CategoryConfigs.NAME_MAX_LENGTH,
});
const ActiveMessage = new BoolMessage('active');
const ParentIdMessage = new UuidMessage('parent id');

async function testAccept(data) {
  const errors = await validateFirstError(data, CreateCategoryRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(property, data, expectedErrors) {
  const errors = await validateFirstError(data, CreateCategoryRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

describe('CreateCategoryRequestDTO', () => {
  it('should pass validation', async () => {
    const errors = await validateFirstError(
      { name: 'Category 1', active: true },
      CreateCategoryRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it('Should accept when name has min length', async () => {
      await testAccept({
        name: 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH),
        active: true,
      });
    });

    it('Should accept when name has max length', async () => {
      await testAccept({
        name: 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH),
        active: true,
      });
    });

    it('should reject when name is number', async () => {
      await testReject(
        'name',
        { name: 2323232, active: true },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is boolean', async () => {
      await testReject(
        'name',
        { name: true, active: true },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is array', async () => {
      await testReject(
        'name',
        { name: [], active: true },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is object', async () => {
      await testReject(
        'name',
        { name: {}, active: true },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is empty', async () => {
      await testReject(
        'name',
        { name: '', active: true },
        { isText: NameMessage.MIN_LEN },
      );
    });

    it('should reject when name is too short', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(CategoryConfigs.NAME_MIN_LENGTH - 1), active: true },
        { isText: NameMessage.MIN_LEN },
      );
    });

    it('should reject when name is too long', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(CategoryConfigs.NAME_MAX_LENGTH + 1), active: true },
        { isText: NameMessage.MAX_LEN },
      );
    });

    it('should reject when name is null', async () => {
      await testReject(
        'name',
        { name: null, active: true },
        { isText: NameMessage.NULL },
      );
    });

    it('should reject when name is undefined', async () => {
      await testReject(
        'name',
        { active: true },
        { isText: NameMessage.REQUIRED },
      );
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
        { name: 'Category name', active: 1 },
        { isBool: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is string', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: 'true' },
        { isBool: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: [] },
        { isBool: ActiveMessage.INVALID },
      );
    });

    it('should reject when active is object', async () => {
      await testReject(
        'active',
        { name: 'Category name', active: {} },
        { isBool: ActiveMessage.INVALID },
      );
    });
  });

  describe('parentId', () => {
    it('should validate when parentId is valid id', async () => {
      await testAccept({
        name: 'Category 1',
        active: false,
        parentId: VALID_UUID,
      });
    });

    it('should validate when parentId is null', async () => {
      await testAccept({
        name: 'Category 1',
        active: false,
        parentId: null,
      });
    });

    it('should validate when parentId is undefined', async () => {
      await testAccept({
        name: 'Category 1',
        active: false,
        parentId: undefined,
      });
    });

    it('should reject when parentId is number', async () => {
      await testReject(
        'parentId',
        { name: 'Category 1', active: false, parentId: 1 as unknown as string },
        { isUuid: ParentIdMessage.STRING },
      );
    });

    it('should reject when parentId is boolean', async () => {
      await testReject(
        'parentId',
        { name: 'Category 1', active: false, parentId: true },
        { isUuid: ParentIdMessage.STRING },
      );
    });

    it('should reject when parentId is invalid string', async () => {
      await testReject(
        'parentId',
        { name: 'Category 1', active: false, parentId: INVALID_UUID },
        { isUuid: ParentIdMessage.INVALID },
      );
    });

    it('should reject when parentId is array', async () => {
      await testReject(
        'parentId',
        { name: 'Category 1', active: false, parentId: [] },
        { isUuid: ParentIdMessage.STRING },
      );
    });

    it('should reject when parentId is object', async () => {
      await testReject(
        'parentId',
        { name: 'Category 1', active: false, parentId: {} },
        { isUuid: ParentIdMessage.STRING },
      );
    });
  });
});
