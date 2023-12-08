import { plainToInstance } from 'class-transformer';
import { UuidMessage } from '../../messages/uuid/uuid.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { IsUuidConstrantOptions, Uuid } from './uuid.decorator';

const VALID_UUID = 'f136f640-90b7-11ed-a2a0-fd911f8f7f38';
const INVALID_UUID = 'not-a-valid-uuid';

describe('Id decorator', () => {
  it('should be defined', () => {
    expect(Uuid).toBeDefined();
  });

  async function testAccept(
    optionsData: IsUuidConstrantOptions,
    data: { userId: string },
    expectedResult: { userId: string },
  ) {
    class TestDTO {
      @Uuid(optionsData) userId: string;
    }
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(expectedResult);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  }

  async function testReject(
    optionsData: IsUuidConstrantOptions,
    data: { userId: number | string },
    constraints,
  ) {
    class TestDTO {
      @Uuid(optionsData) userId: string;
    }
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual(constraints);
  }

  const Messages = new UuidMessage('user id');

  describe('allowUndefined', () => {
    it('should accept undefined uuid when allowUndefined = true', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: true },
        { userId: undefined },
        { userId: undefined },
      );
    });

    it('should accept uuid when allowUndefined = true', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: false },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should accept uuid when allowUndefined = false', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: false },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should accept uuid when allowUndefined = undefined', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: undefined },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should accept uuid when allowUndefined = null', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: null },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should reject undefined uuid when allowUndefined = false', async () => {
      await testReject(
        { label: 'user id', allowUndefined: false },
        { userId: undefined },
        {
          isUuid: Messages.REQUIRED,
        },
      );
    });

    it('should reject undefined uuid when allowUndefined = null', async () => {
      await testReject(
        { label: 'user id', allowUndefined: null },
        { userId: undefined },
        {
          isUuid: Messages.REQUIRED,
        },
      );
    });

    it('should reject undefined uuid when allowUndefined = undefined', async () => {
      await testReject(
        { label: 'user id', allowUndefined: undefined },
        { userId: undefined },
        { isUuid: Messages.REQUIRED },
      );
    });
  });

  describe('allowNull', () => {
    it('should accept null uuid when allowNull = true', async () => {
      await testAccept(
        { label: 'user id', allowNull: true },
        { userId: null },
        { userId: null },
      );
    });

    it('should accept uuid when allowNull = true', async () => {
      await testAccept(
        { label: 'user id', allowNull: false },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should accept uuid when allowNull = false', async () => {
      await testAccept(
        { label: 'user id', allowNull: false },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should accept uuid when allowNull = undefined', async () => {
      await testAccept(
        { label: 'user id', allowNull: undefined },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should accept uuid when allowNull = null', async () => {
      await testAccept(
        { label: 'user id', allowNull: null },
        { userId: VALID_UUID },
        { userId: VALID_UUID },
      );
    });

    it('should reject null uuid when allowNull = false', async () => {
      await testReject(
        { label: 'user id', allowNull: false },
        { userId: null },
        { isUuid: Messages.NULL },
      );
    });

    it('should reject null uuid when allowNull = null', async () => {
      await testReject(
        { label: 'user id', allowNull: null },
        { userId: null },
        { isUuid: Messages.NULL },
      );
    });

    it('should reject null uuid when allowNull = undefined', async () => {
      await testReject(
        { label: 'user id', allowNull: undefined },
        { userId: null },
        { isUuid: Messages.NULL },
      );
    });
  });

  describe('invalid', () => {
    it('should reject when value is number', async () => {
      await testReject(
        { label: 'user id' },
        { userId: 1 as unknown as number },
        { isUuid: Messages.STRING },
      );
    });

    it('should reject when value is boolean', async () => {
      await testReject(
        { label: 'user id' },
        { userId: true as unknown as number },
        { isUuid: Messages.STRING },
      );
    });

    it('should reject when value is invalid string uuid', async () => {
      await testReject(
        { label: 'user id' },
        { userId: INVALID_UUID },
        { isUuid: Messages.INVALID },
      );
    });

    it('should reject when value is array', async () => {
      await testReject(
        { label: 'user id' },
        { userId: [] as unknown as number },
        { isUuid: Messages.STRING },
      );
    });

    it('should reject when value is object', async () => {
      await testReject(
        { label: 'user id' },
        { userId: {} as unknown as number },
        { isUuid: Messages.STRING },
      );
    });
  });
});
