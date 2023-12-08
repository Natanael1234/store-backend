import { plainToInstance } from 'class-transformer';
import { PasswordMessage } from '../../../../system/messages/password/password.messages.enum';
import { TextMessage } from '../../../../system/messages/text/text.messages';
import { validateFirstError } from '../../../../system/utils/validation/validation';
import { UserConfigs } from '../../../../user/configs/user/user.configs';
import { AcceptTermsMessage } from '../../../messages/accept-terms/accept-terms.messages.enum';
import { RegisterRequestDto } from './register.request.dto';

const {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} = UserConfigs;

async function testAccept(property, data) {
  const transformedData = plainToInstance(RegisterRequestDto, data);
  const errors = await validateFirstError(data, RegisterRequestDto);
  expect(transformedData[property]).toEqual(data[property]);
  expect(errors).toHaveLength(0);
}

async function testReject(property, data, expectedErrors) {
  const errors = await await validateFirstError(data, RegisterRequestDto);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

describe('RegisterRequestDto', () => {
  it('should pass validation', async () => {
    const data = {
      name: 'User 1',
      email: 'user@email.com',
      password: 'Abc12*',
      acceptTerms: true,
    };
    const errors = await validateFirstError(data, RegisterRequestDto);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    const Message = new TextMessage('name', {
      minLength: NAME_MIN_LENGTH,
      maxLength: NAME_MAX_LENGTH,
    });

    it('Should accept when name has min length', async () => {
      await testAccept('name', {
        name: 'x'.repeat(NAME_MIN_LENGTH),
        email: 'user@email.com',
        password: 'Ab123*',
        acceptTerms: true,
      });
    });

    it('Should accept when name has max length', async () => {
      await testAccept('name', {
        name: 'x'.repeat(NAME_MAX_LENGTH),
        email: 'user@email.com',
        password: 'Ab123*',
        acceptTerms: true,
      });
    });

    it('should reject when name is number', async () => {
      await testReject(
        'name',
        {
          name: 2323232,
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is boolean', async () => {
      await testReject(
        'name',
        {
          name: true,
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is array', async () => {
      await testReject(
        'name',
        {
          name: [],
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is object', async () => {
      await testReject(
        'name',
        {
          name: {},
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when name is empty', async () => {
      await testReject(
        'name',
        {
          name: '',
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when name is too short', async () => {
      await testReject(
        'name',
        {
          name: 'x'.repeat(NAME_MIN_LENGTH - 1),
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when name is too long', async () => {
      await testReject(
        'name',
        {
          name: 'x'.repeat(NAME_MAX_LENGTH + 1),
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.MAX_LEN },
      );
    });

    it('should reject when name is null', async () => {
      await testReject(
        'name',
        {
          name: null,
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.NULL },
      );
    });

    it('should reject when name is undefined', async () => {
      await testReject(
        'name',
        {
          name: undefined,
          email: 'user@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.REQUIRED },
      );
    });
  });

  describe('email', () => {
    const Message = new TextMessage('email', {
      maxLength: EMAIL_MAX_LENGTH,
    });

    it('Should accept when email has min length', async () => {
      await testAccept('email', {
        name: 'User Name',
        email: 'u@e.co',
        password: 'Ab123*',
        acceptTerms: true,
      });
    });

    it('Should accept when email has max length', async () => {
      await testAccept('email', {
        name: 'User Name',
        email: 'x'.repeat(EMAIL_MAX_LENGTH - 10) + '@email.com',
        password: 'Ab123*',
        acceptTerms: true,
      });
    });

    it('should reject when email is number', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: 2323232,
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when email is boolean', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: true,
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when email is array', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: [],
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when email is object', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: {},
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when email is empty', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: '',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when email is too long', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: 'x'.repeat(EMAIL_MAX_LENGTH - 10 + 1) + '@email.com',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.MAX_LEN },
      );
    });

    it('should reject when email is null', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: null,
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.NULL },
      );
    });

    it('should reject when email is undefined', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: undefined,
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.REQUIRED },
      );
    });

    it('should reject when invalid email format', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: '@invalid_email',
          password: 'Ab123*',
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });
  });

  describe('password', () => {
    const Message = new TextMessage('password', {
      minLength: PASSWORD_MIN_LENGTH,
      maxLength: PASSWORD_MAX_LENGTH,
    });

    it('Should accept when password has min length', async () => {
      await testAccept('password', {
        name: 'User Name',
        email: 'user@email.com',
        password: 'Ab123*',
        acceptTerms: true,
      });
    });

    it('Should accept when password has max length', async () => {
      await testAccept('password', {
        name: 'User Name',
        email: 'user@email.com',
        password: 'Ab123*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 6),
        acceptTerms: true,
      });
    });

    it('should reject when password is number', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 2323232,
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when password is boolean', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: true,
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when password is array', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: [],
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when password is object', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: {},
          acceptTerms: true,
        },
        { isText: Message.INVALID },
      );
    });

    it('should reject when password is empty', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: '',
          acceptTerms: true,
        },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when password too short', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4 - 1),
          acceptTerms: true,
        },
        { isText: Message.MIN_LEN },
      );
    });

    it('should reject when password is too long', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4 + 1),
          acceptTerms: true,
        },
        { isText: Message.MAX_LEN },
      );
    });

    it('should reject when password is null', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: null,
          acceptTerms: true,
        },
        { isText: Message.NULL },
      );
    });

    it('should reject when password is undefined', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: undefined,
          acceptTerms: true,
        },
        { isText: Message.REQUIRED },
      );
    });

    it('should reject when password is missing uppercase letter', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 'ab123*',
          acceptTerms: true,
        },
        { isStrongPassword: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is missing lowercase letter', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 'AB123*',
          acceptTerms: true,
        },
        { isStrongPassword: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is missing lowercase letter', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 'AB123*',
          acceptTerms: true,
        },
        { isStrongPassword: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is missing number', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 'ABcde*',
          acceptTerms: true,
        },
        { isStrongPassword: PasswordMessage.INVALID },
      );
    });

    it('should reject when password is missing special character', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 'AB1234',
          acceptTerms: true,
        },
        { isStrongPassword: PasswordMessage.INVALID },
      );
    });
  });

  describe('acceptTerms', () => {
    it('should validate when accept terms is boolean true', async () => {
      const data = {
        name: 'User 1',
        email: 'user@email.com',
        password: 'Abc12*',
        acceptTerms: true,
      };
      const errors = await validateFirstError(data, RegisterRequestDto);
      expect(errors).toHaveLength(0);
      const transformedValue = plainToInstance(RegisterRequestDto, data);
      expect(transformedValue).toEqual({
        name: 'User 1',
        email: 'user@email.com',
        password: 'Abc12*',
        acceptTerms: true,
      });
    });

    async function testRejectRegister(data, expectedErrors) {
      const errors = await validateFirstError(data, RegisterRequestDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toEqual(expectedErrors);
    }

    it('should reject when acceptTemes is string false', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: 'false',
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is boolean false', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: false,
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is number 0', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: 0,
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is number 1', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: 1,
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes string', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: 'true',
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is array', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: [],
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is object', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: {},
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is null', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: null,
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is undefined', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: undefined,
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is empty', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: '',
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });

    it('should reject when acceptTemes is invalid', async () => {
      await testRejectRegister(
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: 'invalid_boolean_string',
        },
        { equals: AcceptTermsMessage.REQUIRED },
      );
    });
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const NameMessages = new TextMessage('name', {
        minLength: NAME_MIN_LENGTH,
        maxLength: NAME_MAX_LENGTH,
      });
      const EmailMessages = new TextMessage('email', {
        maxLength: EMAIL_MAX_LENGTH,
      });

      const data = {
        name: 'User',
        email: 'email.com',
        password: 'Abc123',
        acceptTerms: false,
      };
      const errors = await validateFirstError(data, RegisterRequestDto);
      expect(errors).toHaveLength(4);
      expect(errors[0].constraints).toEqual({
        isText: NameMessages.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isText: EmailMessages.INVALID });
      expect(errors[2].constraints).toEqual({
        isStrongPassword: PasswordMessage.INVALID,
      });
      expect(errors[3].constraints).toEqual({
        equals: AcceptTermsMessage.REQUIRED,
      });
    });
  });
});
