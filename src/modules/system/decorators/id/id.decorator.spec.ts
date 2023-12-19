import { plainToInstance } from 'class-transformer';
import { IdConfigs } from '../../configs/id/id.configs';
import { IdMessage } from '../../messages/id/id.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { Id, IsIdConstrantOptions } from './id.decorator';

const { MAX_ID, MIN_ID } = IdConfigs;

describe('Id decorator', () => {
  it('should be defined', () => {
    expect(Id).toBeDefined();
  });

  async function testAccept(
    optionsData: IsIdConstrantOptions,
    data: { userId: number | string },
    expectedResult: { userId: number | string },
  ) {
    class TestDTO {
      @Id(optionsData) userId: string;
    }
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(expectedResult);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  }

  async function testReject(
    optionsData: IsIdConstrantOptions,
    data: { userId: number | string },
    constraints,
  ) {
    class TestDTO {
      @Id(optionsData) userId: string;
    }
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual(constraints);
  }

  const Messages = new IdMessage('user id');

  describe('allowUndefined', () => {
    it('should accept undefined when allowUndefined = true', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: true },
        { userId: undefined },
        { userId: undefined },
      );
    });

    it('should accept number when allowUndefined = true', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: false },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should accept number when allowUndefined = false', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: false },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should accept number when allowUndefined = undefined', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: undefined },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should accept number when allowUndefined = null', async () => {
      await testAccept(
        { label: 'user id', allowUndefined: null },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should reject undefined when allowUndefined = false', async () => {
      await testReject(
        { label: 'user id', allowUndefined: false },
        { userId: undefined },
        {
          isId: Messages.REQUIRED,
        },
      );
    });

    it('should reject undefined when allowUndefined = null', async () => {
      await testReject(
        { label: 'user id', allowUndefined: null },
        { userId: undefined },
        {
          isId: Messages.REQUIRED,
        },
      );
    });

    it('should reject undefined when allowUndefined = undefined', async () => {
      await testReject(
        { label: 'user id', allowUndefined: undefined },
        { userId: undefined },
        { isId: Messages.REQUIRED },
      );
    });
  });

  describe('allowNull', () => {
    it('should accept null when allowNull = true', async () => {
      await testAccept(
        { label: 'user id', allowNull: true },
        { userId: null },
        { userId: null },
      );
    });

    it('should accept number when allowNull = true', async () => {
      await testAccept(
        { label: 'user id', allowNull: false },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should accept number when allowNull = false', async () => {
      await testAccept(
        { label: 'user id', allowNull: false },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should accept number when allowNull = undefined', async () => {
      await testAccept(
        { label: 'user id', allowNull: undefined },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should accept number when allowNull = null', async () => {
      await testAccept(
        { label: 'user id', allowNull: null },
        { userId: 1 },
        { userId: 1 },
      );
    });

    it('should reject null when allowNull = false', async () => {
      await testReject(
        { label: 'user id', allowNull: false },
        { userId: null },
        { isId: Messages.NULL },
      );
    });

    it('should reject null when allowNull = null', async () => {
      await testReject(
        { label: 'user id', allowNull: null },
        { userId: null },
        { isId: Messages.NULL },
      );
    });

    it('should reject null when allowNull = undefined', async () => {
      await testReject(
        { label: 'user id', allowNull: undefined },
        { userId: null },
        { isId: Messages.NULL },
      );
    });
  });

  describe('invalid', () => {
    it('should reject when value is boolean', async () => {
      await testReject(
        { label: 'user id' },
        { userId: true as unknown as number },
        { isId: Messages.INVALID },
      );
    });

    it('should reject string', async () => {
      await testReject(
        { label: 'user id' },
        { userId: '1' },
        { isId: Messages.INVALID },
      );
    });

    it('should reject when value is array', async () => {
      await testReject(
        { label: 'user id' },
        { userId: [] as unknown as number },
        { isId: Messages.INVALID },
      );
    });

    it('should reject when value is object', async () => {
      await testReject(
        { label: 'user id' },
        { userId: {} as unknown as number },
        { isId: Messages.INVALID },
      );
    });
  });

  describe('int', () => {
    it('should accept int', async () => {
      await testAccept({ label: 'user id' }, { userId: 1 }, { userId: 1 });
    });

    it('should reject float', async () => {
      await testReject(
        { label: 'user id' },
        { userId: 1.1 },
        { isId: Messages.INT },
      );
    });
  });

  describe('min', () => {
    it('should accept value equal to min', async () => {
      await testAccept(
        { label: 'user id' },
        { userId: MIN_ID },
        { userId: MIN_ID },
      );
    });

    it('should accept value greater than min', async () => {
      await testAccept(
        { label: 'user id' },
        { userId: MIN_ID + 1 },
        { userId: MIN_ID + 1 },
      );
    });

    it('should reject when value smaller than min', async () => {
      await testReject(
        { label: 'user id' },
        { userId: 0 },
        { isId: Messages.MIN },
      );
    });
  });

  describe('max', () => {
    it('should accept value equal to max', async () => {
      await testAccept(
        { label: 'user id' },
        { userId: MAX_ID },
        { userId: MAX_ID },
      );
    });

    it('should accept value smaller than max', async () => {
      await testAccept(
        { label: 'user id' },
        { userId: MAX_ID - 1 },
        { userId: MAX_ID - 1 },
      );
    });

    it('should reject when value greater than max', async () => {
      await testReject(
        { label: 'user id' },
        { userId: MAX_ID + 1 },
        { isId: Messages.MAX },
      );
    });
  });
});
