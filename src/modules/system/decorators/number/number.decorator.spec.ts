import { plainToInstance } from 'class-transformer';
import { NumberMessage } from '../../messages/number/number.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { Num } from './number.decorator';

describe('Text decorator', () => {
  it('should be defined', () => {
    expect(Num).toBeDefined();
  });

  async function testAccept(optionsData, testData) {
    class TestDTO {
      @Num(optionsData) prop: string;
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
      @Num(optionsData) text: string;
    }
    const data = { text: testData };
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual(constraints);
  }

  const Messages = new NumberMessage('prop');

  describe('allowUndefined', () => {
    it('should accept undefined when allowUndefined = true', async () => {
      await testAccept({ label: 'prop', allowUndefined: true }, undefined);
    });

    it('should accept number when allowUndefined = true', async () => {
      await testAccept({ label: 'prop', allowUndefined: false }, 1);
    });

    it('should accept number when allowUndefined = false', async () => {
      await testAccept({ label: 'prop', allowUndefined: false }, 1);
    });

    it('should accept number when allowUndefined = undefined', async () => {
      await testAccept({ label: 'prop', allowUndefined: undefined }, 1);
    });

    it('should accept number when allowUndefined = null', async () => {
      await testAccept({ label: 'prop', allowUndefined: null }, 1);
    });

    it('should reject undefined when allowUndefined = false', async () => {
      await testReject({ label: 'prop', allowUndefined: false }, undefined, {
        isNum: Messages.REQUIRED,
      });
    });

    it('should reject undefined when allowUndefined = null', async () => {
      await testReject({ label: 'prop', allowUndefined: null }, undefined, {
        isNum: Messages.REQUIRED,
      });
    });

    it('should reject undefined when allowUndefined = undefined', async () => {
      await testReject(
        { label: 'prop', allowUndefined: undefined },
        undefined,
        { isNum: Messages.REQUIRED },
      );
    });
  });

  describe('allowNull', () => {
    it('should accept null when allowNull = true', async () => {
      await testAccept({ label: 'prop', allowNull: true }, null);
    });

    it('should accept number when allowNull = true', async () => {
      await testAccept({ label: 'prop', allowNull: false }, 1);
    });

    it('should accept number when allowNull = false', async () => {
      await testAccept({ label: 'prop', allowNull: false }, 1);
    });

    it('should accept number when allowNull = undefined', async () => {
      await testAccept({ label: 'prop', allowNull: undefined }, 1);
    });

    it('should accept number when allowNull = null', async () => {
      await testAccept({ label: 'prop', allowNull: null }, 1);
    });

    it('should reject undefined when allowNull = false', async () => {
      await testReject({ label: 'prop', allowNull: false }, null, {
        isNum: Messages.NULL,
      });
    });

    it('should reject undefined when allowNull = null', async () => {
      await testReject({ label: 'prop', allowNull: null }, null, {
        isNum: Messages.NULL,
      });
    });

    it('should reject undefined when allowNull = undefined', async () => {
      await testReject({ label: 'prop', allowNull: undefined }, null, {
        isNum: Messages.NULL,
      });
    });
  });

  describe('invalid', () => {
    it('should reject when value is boolean', async () => {
      await testReject({ label: 'prop' }, true, { isNum: Messages.INVALID });
    });

    it('should reject when value is string', async () => {
      await testReject({ label: 'prop' }, '1', { isNum: Messages.INVALID });
    });

    it('should reject when value is array', async () => {
      await testReject({ label: 'prop' }, [], { isNum: Messages.INVALID });
    });

    it('should reject when value is object', async () => {
      await testReject({ label: 'prop' }, {}, { isNum: Messages.INVALID });
    });
  });

  describe('onlyInt', () => {
    it('should accept float when onlyInt = false', async () => {
      await testAccept({ label: 'prop', onlyInt: false }, 1.1);
    });

    it('should accept float when onlyInt = null', async () => {
      await testAccept({ label: 'prop', onlyInt: null }, 1.1);
    });

    it('should accept float when onlyInt = undefined', async () => {
      await testAccept({ label: 'prop', onlyInt: undefined }, 1.1);
    });

    it('should accept int when onlyInt = false', async () => {
      await testAccept({ label: 'prop', onlyInt: false }, 1);
    });

    it('should accept int when onlyInt = true', async () => {
      await testAccept({ label: 'prop', onlyInt: false }, 1);
    });

    it('should accept int when onlyInt = null', async () => {
      await testAccept({ label: 'prop', onlyInt: null }, 1);
    });

    it('should accept int when onlyInt = undefined', async () => {
      await testAccept({ label: 'prop', onlyInt: undefined }, 1);
    });

    it('should reject when value is float and onlyInt = true', async () => {
      await testReject({ label: 'prop', onlyInt: true }, 1.1, {
        isNum: Messages.INT,
      });
    });
  });

  describe('min', () => {
    it('should accept value equal to min', async () => {
      await testAccept({ label: 'prop', min: 5 }, 5);
    });

    it('should accept value greater than min', async () => {
      await testAccept({ label: 'prop', min: 5 }, 6);
    });

    it('should reject when value smaller than min', async () => {
      const Messages = new NumberMessage('prop', { min: 4 });
      await testReject({ label: 'prop', min: 4 }, 3, {
        isNum: Messages.MIN,
      });
    });
  });

  describe('max', () => {
    it('should accept value equal to max', async () => {
      await testAccept({ label: 'prop', max: 5 }, 5);
    });

    it('should accept value greater than max', async () => {
      await testAccept({ label: 'prop', max: 5 }, 4);
    });

    it('should reject when value greater than max', async () => {
      const Messages = new NumberMessage('prop', { max: 4 });
      await testReject({ label: 'prop', max: 4 }, 5, {
        isNum: Messages.MAX,
      });
    });
  });
});
