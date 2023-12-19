import { TextMessage } from '../../../../system/messages/text/text.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { UserConfigs } from '../../../../user/configs/user/user.configs';
import { LoginRequestDto } from './login.request.dto';

const { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } =
  UserConfigs;

const validate = async (data) => validateFirstError(data, LoginRequestDto);

async function testAccept(data) {
  const errors = await validate(data);
  expect(errors).toHaveLength(0);
}

async function testReject(property, data, expectedErrors) {
  const errors = await validateFirstError(data, LoginRequestDto);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

const EmailMessage = new TextMessage('email', {
  maxLength: EMAIL_MAX_LENGTH,
});

const PasswordMessage = new TextMessage('password', {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
});

describe('LoginRequestDto', () => {
  it('should pass validation', async () => {
    await testAccept({ email: 'user@email.com', password: '123456' });
  });

  describe('email', () => {
    it('should accept when email has maximum allowed length', async () => {
      await testAccept({
        email: 'x'.repeat(EMAIL_MAX_LENGTH - 10) + '@email.com',
        password: 'Ab123*',
      });
    });

    it('should reject when email is number', async () => {
      await testReject(
        'email',
        { email: 2323232, password: 'Ab123*' },
        { isText: EmailMessage.INVALID },
      );
    });

    it('should reject when email is boolean', async () => {
      await testReject(
        'email',
        { email: true, password: 'Ab123*' },
        { isText: EmailMessage.INVALID },
      );
    });

    it('should reject when email is array', async () => {
      await testReject(
        'email',
        { email: [], password: 'Ab123*' },
        { isText: EmailMessage.INVALID },
      );
    });

    it('should reject when email is object', async () => {
      await testReject(
        'email',
        { email: {}, password: 'Ab123*' },
        { isText: EmailMessage.INVALID },
      );
    });

    it('should reject when email is null', async () => {
      await testReject(
        'email',
        { email: null, password: 'Ab123*' },
        { isText: EmailMessage.NULL },
      );
    });

    it('should reject when email is undefined', async () => {
      await testReject(
        'email',
        { email: undefined, password: 'Ab123*' },
        { isText: EmailMessage.REQUIRED },
      );
    });

    it('should reject when email is empty', async () => {
      await testReject(
        'email',
        { email: '', password: 'Ab123*' },
        { isText: EmailMessage.INVALID },
      );
    });

    it('should reject when email has invalid format', async () => {
      await testReject(
        'email',
        { email: 'email.com', password: 'Ab123*' },
        { isText: EmailMessage.INVALID },
      );
    });

    it('should reject when email longer than allowed', async () => {
      await testReject(
        'email',
        {
          email: 'x'.repeat(EMAIL_MAX_LENGTH - 10 + 1) + '@email.com',
          password: 'Ab123*',
        },
        { isText: EmailMessage.MAX_LEN },
      );
    });
  });

  describe('password', () => {
    it('should reject when password has min allowed length', async () => {
      await testAccept({
        email: 'user@email.com',
        password: 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4),
      });
    });

    it('should reject when password is number', async () => {
      await testReject(
        'password',
        { email: 'user@email.com', password: 2323232 },
        { isText: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is true', async () => {
      await testReject(
        'password',
        { email: 'user@email.com', password: true },
        { isText: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is []', async () => {
      await testReject(
        'password',
        { email: 'user@email.com', password: [] },
        { isText: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is {}', async () => {
      await testReject(
        'password',
        { email: 'user@email.com', password: {} },
        { isText: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is null', async () => {
      await testReject(
        'password',
        { email: 'user@email.com', password: null },
        { isText: PasswordMessage.NULL },
      );
    });

    it('should reject when password is undefined', async () => {
      await testReject(
        'password',
        { email: 'user@email.com', password: undefined },
        { isText: PasswordMessage.REQUIRED },
      );
    });

    it('should reject when password is empty string', async () => {
      await testReject(
        'password',
        { email: 'user@email.com', password: '' },
        { isText: PasswordMessage.MIN_LEN },
      );
    });

    it('should reject when password is longer than allowed', async () => {
      await testReject(
        'password',
        {
          email: 'user@email.com',
          password: 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4 + 1),
        },
        { isText: PasswordMessage.MAX_LEN },
      );
    });
  });

  describe('multiple errors', () => {
    it('should reject when there are multiple errors', async () => {
      const data = { email: '@emailcom', password: '12345' };
      const errors = await validate(data);
      expect(errors).toHaveLength(2);
      expect(errors[0].property).toEqual('email');
      expect(errors[0].value).toEqual(data.email);
      expect(errors[0].constraints).toEqual({
        isText: EmailMessage.INVALID,
      });
      expect(errors[1].property).toEqual('password');
      expect(errors[1].value).toEqual(data.password);
      expect(errors[1].constraints).toEqual({
        isText: PasswordMessage.MIN_LEN,
      });
    });
  });
});
