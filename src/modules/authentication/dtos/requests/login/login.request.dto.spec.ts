import { EmailMessage } from '../../../../system/enums/messages/email-messages/email-messages.enum';
import { PasswordMessage } from '../../../../system/enums/messages/password-messages/password-messages.enum';
import { validateFirstError } from '../../../../system/utils/validation';
import { LoginRequestDto } from './login.request.dto';

const validate = async (data) => validateFirstError(data, LoginRequestDto);

describe('LoginRequestDto', () => {
  it('should pass validation', async () => {
    const data = { email: 'user@email.com', password: '123456' };
    const errors = await validate(data);

    expect(errors).toHaveLength(0);
  });

  describe('email', () => {
    it.each([
      {
        emailDescription: 'number',
        email: 2323232,
        expectedErrors: { isString: EmailMessage.STRING },
      },
      {
        emailDescription: 'boolean',
        email: true,
        expectedErrors: { isString: EmailMessage.STRING },
      },
      {
        emailDescription: 'array',
        email: [],
        expectedErrors: { isString: EmailMessage.STRING },
      },
      {
        emailDescription: 'object',
        email: {},
        expectedErrors: { isString: EmailMessage.STRING },
      },
      {
        emailDescription: 'null',
        email: null,
        expectedErrors: { isNotEmpty: EmailMessage.REQUIRED },
      },
      {
        emailDescription: 'undefined',
        email: undefined,
        expectedErrors: { isNotEmpty: EmailMessage.REQUIRED },
      },
      {
        emailDescription: 'empty',
        email: '',
        expectedErrors: { isNotEmpty: EmailMessage.REQUIRED },
      },
      {
        emailDescription: 'invalid formated',
        email: 'email.com',
        expectedErrors: { isEmail: EmailMessage.INVALID },
      },
    ])(
      'should fail when email is $emailDescription',
      async ({ email, expectedErrors }) => {
        const data = { email, password: '123456' };
        const errors = await validateFirstError(data, LoginRequestDto);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('email');
        expect(errors[0].value).toEqual(data.email);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('should validate only when the email has less than 60 characters', async () => {
      const data = [
        { email: 'x'.repeat(50) + '@email.com', password: 'Ab123*' },
        { email: 'x'.repeat(51) + '@email.com', password: 'Ab123*' },
      ];

      const validations = [await validate(data[0]), await validate(data[1])];

      expect(validations[0]).toHaveLength(0);
      expect(validations[1]).toHaveLength(1);
      expect(validations[1][0].property).toEqual('email');
      expect(validations[1][0].value).toEqual(data[1].email);
      expect(validations[1][0].constraints).toEqual({
        maxLength: EmailMessage.MAX_LEN,
      });
    });
  });

  describe('password', () => {
    it.each([
      {
        passwordDescription: 'number',
        password: 2323232,
        expectedErrors: { isString: PasswordMessage.STRING },
      },
      {
        passwordDescription: 'boolean',
        password: true,
        expectedErrors: { isString: PasswordMessage.STRING },
      },
      {
        passwordDescription: 'array',
        password: [],
        expectedErrors: { isString: PasswordMessage.STRING },
      },
      {
        passwordDescription: 'object',
        password: {},
        expectedErrors: { isString: PasswordMessage.STRING },
      },
      {
        passwordDescription: 'null',
        password: null,
        expectedErrors: { isNotEmpty: PasswordMessage.REQUIRED },
      },
      {
        passwordDescription: 'undefined',
        password: undefined,
        expectedErrors: { isNotEmpty: PasswordMessage.REQUIRED },
      },
      {
        passwordDescription: 'empty',
        password: '',
        expectedErrors: { isNotEmpty: PasswordMessage.REQUIRED },
      },
    ])(
      'should fail validation when password is $passwordDescription',
      async ({ password, expectedErrors }) => {
        const data = { email: 'user@email.com', password };
        const errors = await validate(data);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('password');
        expect(errors[0].value).toEqual(data.password);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );
  });

  describe('multiple errors', () => {
    it('should fail validation when there are multiple errors', async () => {
      const data = { email: '@emailcom', password: '12345' };
      const errors = await validate(data);

      expect(errors).toHaveLength(2);

      expect(errors[0].property).toEqual('email');
      expect(errors[0].value).toEqual(data.email);
      expect(errors[0].constraints).toEqual({
        isEmail: EmailMessage.INVALID,
      });
      expect(errors[1].property).toEqual('password');
      expect(errors[1].value).toEqual(data.password);
      expect(errors[1].constraints).toEqual({
        minLength: PasswordMessage.MIN_LEN,
      });
    });
  });
});
