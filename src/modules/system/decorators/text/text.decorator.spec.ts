import { plainToInstance } from 'class-transformer';
import { TextMessage } from '../../messages/text/text.messages';
import { validateFirstError } from '../../utils/validation/validation';
import { IsTextConstrantOptions, Text } from './text.decorator';

const Messages = new TextMessage('text', { minLength: 5, maxLength: 50 });

describe('Text decorator', () => {
  it('should be defined', () => {
    expect(Text).toBeDefined();
  });

  async function testAccept(
    options: IsTextConstrantOptions,
    data: { text: string },
    expectedResult: { text: string },
  ) {
    class TestDTO {
      @Text(options) text: string;
    }
    const dto = plainToInstance(TestDTO, data);
    expect(dto).toEqual(expectedResult);
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(0);
  }

  async function testReject(
    options: IsTextConstrantOptions,
    data: { text: string },
    constraints,
  ) {
    class TestDTO {
      @Text(options) text: string;
    }
    const errors = await validateFirstError(data, TestDTO);
    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual(constraints);
  }

  describe('undefined', () => {
    it('should accept undefined when allowUndefined = true', async () => {
      await testAccept(
        { label: 'test', allowUndefined: true },
        { text: undefined },
        { text: undefined },
      );
    });

    it('should accept undefined when allowNull = false', async () => {
      await testAccept(
        { label: 'test', allowNull: false, allowUndefined: true },
        { text: undefined },
        { text: undefined },
      );
    });

    it('should accept undefined when allowNull = true', async () => {
      await testAccept(
        { label: 'test', allowNull: true, allowUndefined: true },
        { text: null },
        { text: null },
      );
    });

    it('should accept valid value when allowUndefined = false', async () => {
      await testAccept(
        { label: 'test', allowUndefined: false },
        { text: 'x'.repeat(5) },
        { text: 'x'.repeat(5) },
      );
    });

    it('should accept valid value when allowUndefined = true', async () => {
      await testAccept(
        { label: 'test', allowUndefined: true },
        { text: 'x'.repeat(5) },
        { text: 'x'.repeat(5) },
      );
    });

    it('should reject undefined value when allowUndefined = false', () => {
      testReject(
        { label: 'text', allowUndefined: false },
        { text: undefined },
        { isText: Messages.REQUIRED },
      );
    });
  });

  // null

  describe('null', () => {
    it('should accept null when allowNull = true', async () => {
      await testAccept(
        { label: 'test', allowNull: true },
        { text: null },
        { text: null },
      );
    });

    it('should accept null when allowUndefined = false', async () => {
      await testAccept(
        { label: 'test', allowUndefined: false, allowNull: true },
        { text: null },
        { text: null },
      );
    });

    it('should accept null when allowUndefined = true', async () => {
      await testAccept(
        { label: 'test', allowUndefined: true, allowNull: true },
        { text: null },
        { text: null },
      );
    });

    it('should accept valid value when allowNull = false', async () => {
      await testAccept(
        { label: 'test', allowNull: false },
        { text: 'x'.repeat(5) },
        { text: 'x'.repeat(5) },
      );
    });

    it('should accept valid value when allowNull = true', async () => {
      await testAccept(
        { label: 'test', allowNull: true },
        { text: 'x'.repeat(5) },
        { text: 'x'.repeat(5) },
      );
    });

    it('should reject null value when allowNull = false', () => {
      testReject(
        { label: 'text', allowNull: false },
        { text: null },
        { isText: Messages.NULL },
      );
    });
  });

  // min length

  describe('min length', () => {
    it('should accept minimum length string when minLength defined', async () => {
      await testAccept(
        { label: 'test', minLength: 5 },
        { text: 'x'.repeat(5) },
        { text: 'x'.repeat(5) },
      );
    });

    it('should accept empty string when minLength not defined', async () => {
      await testAccept({ label: 'test' }, { text: '' }, { text: '' });
    });

    it('should reject string shorter than allowed when maxLength is defined', () => {
      testReject(
        { label: 'text', minLength: 5 },
        { text: 'x'.repeat(4) },
        { isText: Messages.MIN_LEN },
      );
    });
  });

  // max length

  describe('max length', () => {
    it('should accept when maximum length string when maxLength is defined', async () => {
      await testAccept(
        { label: 'test', maxLength: 50 },
        { text: 'x'.repeat(50) },
        { text: 'x'.repeat(50) },
      );
    });

    it('should accept very long string when maxLength is not defined', async () => {
      await testAccept(
        { label: 'test' },
        { text: 'x'.repeat(200) },
        { text: 'x'.repeat(200) },
      );
    });

    it('should reject string longer than allowed when maxLength is defined', () => {
      testReject(
        { label: 'text', maxLength: 50 },
        { text: 'x'.repeat(51) },
        { isText: Messages.MAX_LEN },
      );
    });
  });

  // email

  describe('email', () => {
    it('should accept valid email when pattern="email"', async () => {
      await testAccept(
        { label: 'test', pattern: 'email' },
        { text: 'user@email.com' },
        { text: 'user@email.com' },
      );
    });

    it('should reject invalid email when pattern="email"', () => {
      testReject(
        { label: 'text', pattern: 'email' },
        { text: 'abc' },
        { isText: Messages.INVALID },
      );
    });
  });

  // phone

  describe('phone', () => {
    it('should accept valid phone when pattern="phone"', async () => {
      await testAccept(
        { label: 'test', pattern: 'phone' },
        { text: '99999-9999' },
        { text: '99999-9999' },
      );
    });

    it('should reject invalid phone when pattern="phone"', () => {
      testReject(
        { label: 'text', pattern: 'phone' },
        { text: 'xyz' },
        { isText: Messages.INVALID },
      );
    });
  });

  describe('invalid', () => {
    it('should fail when value is true', () => {
      testReject(
        { label: 'text' },
        { text: true as unknown as string },
        { isText: Messages.INVALID },
      );
    });

    it('should fail when value is false', () => {
      testReject(
        { label: 'text' },
        { text: false as unknown as string },
        { isText: Messages.INVALID },
      );
    });

    it('should fail when value is number', () => {
      testReject(
        { label: 'text' },
        { text: 5 as unknown as string },
        { isText: Messages.INVALID },
      );
    });

    it('should fail when value is array', () => {
      testReject(
        { label: 'text' },
        { text: [] as unknown as string },
        { isText: Messages.INVALID },
      );
    });

    it('should fail when value is object', () => {
      testReject(
        { label: 'text' },
        { text: {} as unknown as string },
        { isText: Messages.INVALID },
      );
    });
  });
});
