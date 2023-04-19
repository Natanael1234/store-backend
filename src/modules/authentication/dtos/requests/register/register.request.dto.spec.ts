import { plainToInstance } from 'class-transformer';
import { TestUserData } from '../../../../../test/test-user-data';
import { validateFirstError } from '../../../../system/utils/validation';
import { EmailMessage } from '../../../../user/enums/email-messages/email-messages.enum';
import { NameMessage } from '../../../../user/enums/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../../user/enums/password-messages/password-messages.enum';
import { AcceptTermsMessage } from '../../../enums/accept-terms-messages.ts/accept-terms-messages.enum';
import { RegisterRequestDto } from './register.request.dto';

const validate = async (data) =>
  await validateFirstError(data, RegisterRequestDto);

describe('RegisterRequestDto', () => {
  it('should pass validation', async () => {
    const data = {
      name: 'User 1',
      email: 'user@email.com',
      password: 'Abc12*',
      acceptTerms: true,
    };
    const errors = await validate(data);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it.each(TestUserData.getNameErrorDataList('register'))(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validate(data);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('Should validate name from 6 to 60 characters', async () => {
      const data = [
        {
          name: 'x'.repeat(6),
          email: 'user@email.com',
          password: 'Password123*',
          acceptTerms: true,
        },
        {
          name: 'x'.repeat(60),
          email: 'user@email.com',
          password: 'Password123*',
          acceptTerms: true,
        },
      ];
      const errors = [
        await validateFirstError(data[0], RegisterRequestDto),
        await validateFirstError(data[1], RegisterRequestDto),
      ];

      expect(errors[0]).toHaveLength(0);
      expect(errors[1]).toHaveLength(0);
    });
  });

  describe('email', () => {
    it.each(TestUserData.getEmailErrorDataList('register'))(
      'should fail validation when email is $emailDescription',
      async ({ data, expectedErrors }) => {
        const errors = await validate(data);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('email');
        expect(errors[0].value).toEqual(data.email);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('should only validate emails up to max length.', async () => {
      const data = {
        name: 'User 1',
        email: 'u'.repeat(51) + '@email.com',
        password: 'Password123*',
        acceptTerms: true,
      };
      const errors = await validate(data);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toEqual('email');
      expect(errors[0].value).toEqual(data.email);
      expect(errors[0].constraints).toEqual({
        maxLength: EmailMessage.MAX_LEN,
      });
    });
  });

  describe('password', () => {
    it.each(TestUserData.getPasswordErrorDataList('register'))(
      'should fail validation when password is $passwordDescription',
      async ({ data, expectedErrors }) => {
        const errors = await validate(data);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('password');
        expect(errors[0].value).toEqual(data.password);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('Should validate passwords with valid length', async () => {
      const data = [
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Abc12*' + 'x'.repeat(6),
          acceptTerms: true,
        },
      ];
      const errors = [
        await validateFirstError(data[0], RegisterRequestDto),
        await validateFirstError(data[1], RegisterRequestDto),
      ];

      expect(errors[0]).toHaveLength(0);
      expect(errors[1]).toHaveLength(0);
    });
  });

  describe('acceptTerms', () => {
    it('should validate when accept terms is boolean true', async () => {
      const data = {
        name: 'User 1',
        email: 'user@email.com',
        password: 'Abc12*',
        acceptTerms: 'true',
      };
      const transformedValue = plainToInstance(
        RegisterRequestDto,
        data,
      ).acceptTerms;
      const errors = await validate(data);

      expect(transformedValue).toEqual(true);
      expect(errors).toHaveLength(0);
    });

    it('should transform transform transform string true into boolean true and validate', async () => {
      const data = {
        name: 'User 1',
        email: 'user@email.com',
        password: 'Abc12*',
        acceptTerms: 'true',
      };
      const transformedValue = plainToInstance(
        RegisterRequestDto,
        data,
      ).acceptTerms;
      const errors = await validate(data);

      expect(transformedValue).toEqual(true);
      expect(errors).toHaveLength(0);
    });

    it('should transform accept terms when string into boolean true', async () => {
      const data = {
        name: 'User 1',
        email: 'user@email.com',
        password: 'Abc12*',
        acceptTerms: 'true',
      };

      const transformedValue = plainToInstance(
        RegisterRequestDto,
        data,
      ).acceptTerms;
      const errors = await validate(data);

      expect(errors).toHaveLength(0);
      expect(transformedValue).toEqual(true);
    });

    it.each([
      {
        acceptTermsDescription: 'string false',
        acceptTerms: 'false',
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'boolean false',
        acceptTerms: false,
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'number 0',
        acceptTerms: 0,
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'number 1',
        acceptTerms: 1,
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'array',
        acceptTerms: [],
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'object',
        acceptTerms: {},
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'null',
        acceptTerms: null,
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'undefined',
        acceptTerms: undefined,
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'empty',
        acceptTerms: '',
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
      {
        acceptTermsDescription: 'invalid',
        acceptTerms: 'invalid_boolean_string',
        expectedErrors: { equals: AcceptTermsMessage.REQUIRED },
      },
    ])(
      'should fail when accept terms is $acceptTermsDescription',
      async ({ acceptTerms, expectedErrors }) => {
        const data = {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms,
        };
        const errors = await validate(data);
        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const data = {
        name: 'User',
        email: 'email.com',
        password: 'Abc123',
        acceptTerms: false,
      };
      const errors = await validate(data);
      expect(errors).toHaveLength(4);
      expect(errors[0].constraints).toEqual({
        minLength: NameMessage.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isEmail: EmailMessage.INVALID });
      expect(errors[2].constraints).toEqual({
        isStrongPassword: PasswordMessage.INVALID,
      });
      expect(errors[3].constraints).toEqual({
        equals: AcceptTermsMessage.REQUIRED,
      });
    });
  });
});
