import { plainToInstance } from 'class-transformer';
import { BoolMessage } from '../../messages/bool/bool.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { Bool } from './bool.decorator';

describe('Bool decorator', () => {
  it('should be defined', () => {
    expect(Bool).toBeDefined();
  });

  async function testAccept(optionsData, testData) {
    class TestDTO {
      @Bool(optionsData) prop: string;
    }
    const data = { prop: testData };
    const expectedResult = { prop: testData };
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(expectedResult);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  }

  async function testReject(optionsData, testData, constraints) {
    class TestDTO {
      @Bool(optionsData) text: string;
    }
    const data = { text: testData };

    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual(constraints);
  }

  const Messages = new BoolMessage('prop');

  describe('undefined', () => {
    it('should accept undefined when allowUndefined = true', async () => {
      await testAccept({ label: 'test', allowUndefined: true }, undefined);
    });

    it('should accept undefined when allowNull = false', async () => {
      await testAccept(
        { label: 'test', allowNull: false, allowUndefined: true },
        undefined,
      );
    });

    it('should accept undefined when allowNull = true', async () => {
      await testAccept(
        { label: 'test', allowNull: true, allowUndefined: true },
        null,
      );
    });

    it('should accept true when allowUndefined = true', async () => {
      await testAccept({ label: 'test', allowUndefined: false }, true);
    });

    it('should accept true when allowUndefined = false', async () => {
      await testAccept({ label: 'test', allowUndefined: false }, true);
    });

    it('should accept false when allowUndefined = true', async () => {
      await testAccept({ label: 'test', allowUndefined: true }, false);
    });

    it('should accept false when allowUndefined = false', async () => {
      await testAccept({ label: 'test', allowUndefined: true }, false);
    });

    it('should reject undefined when allowUndefined = false', async () => {
      await testReject({ label: 'prop', allowUndefined: false }, undefined, {
        isBool: Messages.REQUIRED,
      });
    });
  });

  describe('null', () => {
    it('should accept null when allowNull = true', async () => {
      await testAccept({ label: 'test', allowNull: true }, null);
    });

    it('should accept null when allowUndefined = false', async () => {
      await testAccept(
        { label: 'test', allowUndefined: false, allowNull: true },
        null,
      );
    });

    it('should accept null when allowUndefined = true', async () => {
      await testAccept(
        { label: 'test', allowUndefined: true, allowNull: true },
        null,
      );
    });

    it('should accept true when allowNull = false', async () => {
      await testAccept({ label: 'test', allowNull: false }, true);
    });

    it('should accept true when allowNull = true', async () => {
      await testAccept({ label: 'test', allowNull: true }, false);
    });

    it('should accept false when allowNull = false', async () => {
      await testAccept({ label: 'test', allowNull: false }, true);
    });

    it('should reject null value when allowNull = false', async () => {
      await testReject({ label: 'prop', allowNull: false }, null, {
        isBool: Messages.NULL,
      });
    });

    it('should accept false when allowNull = true', async () => {
      await testAccept({ label: 'test', allowNull: true }, false);
    });
  });

  describe('invalid', () => {
    it('should reject when value is string', async () => {
      await testReject({ label: 'prop' }, 'true', { isBool: Messages.INVALID });
    });

    it('should reject when value is number', async () => {
      await testReject({ label: 'prop' }, 5, { isBool: Messages.INVALID });
    });

    it('should reject when value is array', async () => {
      await testReject({ label: 'prop' }, [], { isBool: Messages.INVALID });
    });

    it('should reject when value is object', async () => {
      await testReject({ label: 'prop' }, {}, { isBool: Messages.INVALID });
    });
  });
});
