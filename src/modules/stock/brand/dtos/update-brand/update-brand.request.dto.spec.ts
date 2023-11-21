import { BoolMessage } from '../../../../system/messages/bool/bool.messages';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { BrandConfigs } from '../../configs/brand/brand.configs';

import { UpdateBrandRequestDTO } from './update-brand.request.dto';

const { NAME_MAX_LENGTH, NAME_MIN_LENGTH } = BrandConfigs;

const NameMessage = new TextMessage('name', {
  minLength: NAME_MIN_LENGTH,
  maxLength: NAME_MAX_LENGTH,
});
const Messages = new BoolMessage('active');

describe('UpdateBrandRequestDTO', () => {
  it('should pass validation', async () => {
    const brandData = [
      { name: 'Brand 1', active: true },
      { name: 'Brand 2', active: false },
      { name: 'Brand 3' },
    ];

    const errors = await validateFirstError(
      brandData[0],
      UpdateBrandRequestDTO,
    );
    expect(errors).toHaveLength(0);
  });

  async function testAccept(data) {
    const errors = await validateFirstError(data, UpdateBrandRequestDTO);
    expect(errors).toHaveLength(0);
  }

  async function testReject(property, data, expectedErrors) {
    const errors = await validateFirstError(data, UpdateBrandRequestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toEqual(property);
    expect(errors[0].value).toEqual(data[property]);
    expect(errors[0].constraints).toEqual(expectedErrors);
  }

  describe('name', () => {
    it(`should accept when name has min length`, async () => {
      await testAccept({
        name: 'x'.repeat(NAME_MIN_LENGTH),
        active: false,
      });
    });

    it(`should accept when name has max length`, async () => {
      await testAccept({
        name: 'x'.repeat(NAME_MAX_LENGTH),
        active: false,
      });
    });

    it(`should accept when name is undefined`, async () => {
      await testAccept({ name: undefined, active: false });
    });

    it('should reject when name is number', async () => {
      await testReject(
        'name',
        { name: 2323232, active: false },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is boolean', async () => {
      await testReject(
        'name',
        { name: true, active: false },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is array', async () => {
      await testReject(
        'name',
        { name: [], active: false },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is object', async () => {
      await testReject(
        'name',
        { name: {}, active: false },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is empty', async () => {
      await testReject(
        'name',
        { name: '', active: false },
        { isText: NameMessage.MIN_LEN },
      );
    });

    it('should reject when name is too short', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(NAME_MIN_LENGTH - 1), active: false },
        { isText: NameMessage.MIN_LEN },
      );
    });

    it('should reject when name is too long', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(NAME_MAX_LENGTH + 1), active: false },
        { isText: NameMessage.MAX_LEN },
      );
    });

    it('should reject when name is null', async () => {
      await testReject(
        'name',
        { name: null, active: false },
        { isText: NameMessage.NULL },
      );
    });
  });

  describe('active', () => {
    it('should accept when active is true', async () => {
      await testAccept({ name: 'Brand name', active: true });
    });

    it('should accept when active is false', async () => {
      await testAccept({ name: 'Brand name', active: false });
    });

    it('should accept when active is undefined', async () => {
      await testAccept({ name: 'Brand name', active: undefined });
    });

    it('should reject when active is null', async () => {
      await testReject(
        'active',
        { name: 'Brand name', active: null },
        { isBool: Messages.NULL },
      );
    });

    it('should reject when active is number', async () => {
      await testReject(
        'active',
        { name: 'Brand name', active: 1 },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is string', async () => {
      await testReject(
        'active',
        { name: 'Brand name', active: 'true' },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject(
        'active',
        { name: 'Brand name', active: [] },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is object', async () => {
      await testReject(
        'active',
        { name: 'Brand name', active: {} },
        { isBool: Messages.INVALID },
      );
    });
  });
});
