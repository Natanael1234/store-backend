import { CreateUserRequestDTO } from './create-user.request.dto';
import { validateFirstError } from '../../../system/utils/validation';
import { PasswordMessage } from '../../enums/password-messages/password-messages.enum';
import { NameMessage } from '../../enums/name-messages/name-messages.enum';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';

const validate = (data) => validateFirstError(data, CreateUserRequestDTO);

describe('CreateUserRequestDto', () => {
  it('should pass validation', async () => {
    const data = {
      name: 'User 1',
      email: 'user@email.com',
      password: 'Ab123*',
    };
    const errors = await validate(data);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it.each([
      {
        nameDescription: 'number',
        name: 2323232,
        expectedErrors: {
          isString: NameMessage.STRING,
        },
      },
      {
        nameDescription: 'boolean',
        name: true,
        expectedErrors: {
          isString: NameMessage.STRING,
        },
      },
      {
        nameDescription: 'array',
        name: [],
        expectedErrors: {
          isString: NameMessage.STRING,
        },
      },
      {
        nameDescription: 'object',
        name: {},
        expectedErrors: {
          isString: NameMessage.STRING,
        },
      },
      {
        nameDescription: 'null',
        name: null,
        expectedErrors: {
          isNotEmpty: NameMessage.REQUIRED,
        },
      },
      {
        nameDescription: 'undefined',
        name: undefined,
        expectedErrors: {
          isNotEmpty: NameMessage.REQUIRED,
        },
      },
      {
        nameDescription: 'empty',
        name: '',
        expectedErrors: {
          isNotEmpty: NameMessage.REQUIRED,
        },
      },
      {
        nameDescription: 'too short',
        name: 'Usr',
        expectedErrors: {
          minLength: NameMessage.MIN_LEN,
        },
      },
      {
        nameDescription: 'empty',
        name: '',
        expectedErrors: {
          isNotEmpty: NameMessage.REQUIRED,
        },
      },
      {
        nameDescription: 'too short',
        name: 'Usr',
        expectedErrors: {
          minLength: NameMessage.MIN_LEN,
        },
      },
    ])(
      'should fail validation when name is $nameDescription',
      async ({ name, expectedErrors }) => {
        const data = {
          name,
          email: 'user@email.com',
          password: 'Acb12$',
        };

        const errors = await validate(data);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('Should validate only name between 6 and 60 characters', async () => {
      const data = [
        {
          name: 'User',
          email: 'user@email.com',
          password: 'Password123*',
        },
        {
          name: 'User 2',
          email: 'user@email.com',
          password: 'Password123*',
        },
        {
          name: 'User ' + '3'.repeat(55),
          email: 'user@email.com',
          password: 'Password123*',
        },
        {
          name: 'User ' + 'x'.repeat(56),
          email: 'user@email.com',
          password: 'Password123*',
        },
      ];

      const errors = [
        await validate(data[0]),
        await validate(data[1]),
        await validate(data[2]),
        await validate(data[3]),
      ];

      expect(errors[0]).toHaveLength(1);
      expect(errors[0][0].property).toEqual('name');
      expect(errors[0][0].value).toEqual(data[0].name);
      expect(errors[0][0].constraints).toEqual({
        minLength: NameMessage.MIN_LEN,
      });

      expect(errors[1]).toHaveLength(0);
      expect(errors[2]).toHaveLength(0);

      expect(errors[3]).toHaveLength(1);
      expect(errors[3][0].property).toEqual('name');
      expect(errors[3][0].value).toEqual(data[3].name);
      expect(errors[3][0].constraints).toEqual({
        maxLength: NameMessage.MAX_LEN,
      });
    });
  });

  describe('email', () => {
    it.each([
      {
        emailDescription: 'number',
        email: 2323232,
        expectedErrors: {
          isString: EmailMessage.STRING,
        },
      },
      {
        emailDescription: 'boolean',
        email: true,
        expectedErrors: {
          isString: EmailMessage.STRING,
        },
      },
      {
        emailDescription: 'array',
        email: [],
        expectedErrors: {
          isString: EmailMessage.STRING,
        },
      },
      {
        emailDescription: 'object',
        email: {},
        expectedErrors: {
          isString: EmailMessage.STRING,
        },
      },
      {
        emailDescription: 'null',
        email: null,
        expectedErrors: {
          isNotEmpty: EmailMessage.REQUIRED,
        },
      },
      {
        emailDescription: 'undefined',
        email: undefined,
        expectedErrors: {
          isNotEmpty: EmailMessage.REQUIRED,
        },
      },
      {
        emailDescription: 'empty',
        email: '',
        expectedErrors: {
          isNotEmpty: EmailMessage.REQUIRED,
        },
      },
      {
        emailDescription: 'invalid',
        email: 'email.com',
        expectedErrors: {
          isEmail: EmailMessage.INVALID,
        },
      },
    ])(
      'should fail validation when email is $emailDescription',
      async ({ email, expectedErrors }) => {
        const data = {
          name: 'User 1',
          email,
          password: 'Abc12$',
        };
        const errors = await validate(data);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('email');
        expect(errors[0].value).toEqual(data.email);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );
  });

  describe('password', () => {
    it.each([
      {
        passwordDescription: 'number',
        password: 2323232,
        expectedErrors: {
          isString: PasswordMessage.STRING,
        },
      },
      {
        passwordDescription: 'boolean',
        password: true,
        expectedErrors: {
          isString: PasswordMessage.STRING,
        },
      },
      {
        passwordDescription: 'array',
        password: [],
        expectedErrors: {
          isString: PasswordMessage.STRING,
        },
      },
      {
        passwordDescription: 'object',
        password: {},
        expectedErrors: {
          isString: PasswordMessage.STRING,
        },
      },
      {
        passwordDescription: 'null',
        password: null,
        expectedErrors: {
          isNotEmpty: PasswordMessage.REQUIRED,
        },
      },
      {
        passwordDescription: 'undefined',
        password: undefined,
        expectedErrors: {
          isNotEmpty: PasswordMessage.REQUIRED,
        },
      },
      {
        passwordDescription: 'empty',
        password: '',
        expectedErrors: {
          isNotEmpty: PasswordMessage.REQUIRED,
        },
      },
      {
        passwordDescription: 'too short',
        password: 'Usr',
        expectedErrors: {
          minLength: PasswordMessage.MIN_LEN,
        },
      },
      {
        passwordDescription: 'without uppercase letter',
        password: 'senha123*',
        expectedErrors: {
          isStrongPassword: PasswordMessage.INVALID,
        },
      },
      {
        passwordDescription: 'without lowercase letter',
        password: 'SENHA123*',
        expectedErrors: {
          isStrongPassword: PasswordMessage.INVALID,
        },
      },
      {
        passwordDescription: 'without number',
        password: 'SenhaABC*',
        expectedErrors: {
          isStrongPassword: PasswordMessage.INVALID,
        },
      },
      {
        passwordDescription: 'without special character',
        password: 'Senha123',
        expectedErrors: {
          isStrongPassword: PasswordMessage.INVALID,
        },
      },
    ])(
      'should fail validation when password is $passwordDescription',
      async ({ password, expectedErrors }) => {
        const data = {
          name: 'User 1',
          email: 'user@email.com',
          password,
        };
        const errors = await validate(data);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('password');
        expect(errors[0].value).toEqual(data.password);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('Should validate only password between 6 and 12 characters', async () => {
      const data = [
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Se*12',
        },
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Se*123',
        },
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Se*123456789',
        },
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Se*1234567890',
        },
      ];
      const errors = [
        await validate(data[0]),
        await validate(data[1]),
        await validate(data[2]),
        await validate(data[3]),
      ];
      expect(errors[0]).toHaveLength(1);
      expect(errors[0][0].property).toEqual('password');
      expect(errors[0][0].value).toEqual(data[0].password);
      expect(errors[0][0].constraints).toEqual({
        minLength: PasswordMessage.MIN_LEN,
      });

      expect(errors[1]).toHaveLength(0);
      expect(errors[2]).toHaveLength(0);

      expect(errors[3]).toHaveLength(1);
      expect(errors[3][0].property).toEqual('password');
      expect(errors[3][0].value).toEqual(data[3].password);
      expect(errors[3][0].constraints).toEqual({
        maxLength: PasswordMessage.MAX_LEN,
      });
    });
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const data = { name: 'User', email: 'email.com' };
      const errors = await validate(data);

      expect(errors).toHaveLength(3);
      expect(errors[0].constraints).toEqual({
        minLength: NameMessage.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isEmail: EmailMessage.INVALID });
    });
  });
});
