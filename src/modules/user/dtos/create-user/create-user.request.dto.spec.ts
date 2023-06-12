import { TestUserData } from '../../../../test/test-user-data';
import { validateFirstError } from '../../../system/utils/validation';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';
import { NameMessage } from '../../enums/name-messages/name-messages.enum';
import { CreateUserRequestDTO } from './create-user.request.dto';

describe('CreateUserRequestDto', () => {
  it('should pass validation', async () => {
    const data = {
      name: 'User 1',
      email: 'user@email.com',
      password: 'Ab123*',
    };
    const errors = await validateFirstError(data, CreateUserRequestDTO);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it.each(TestUserData.getNameErrorDataList('create'))(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);
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
        },
        {
          name: 'x'.repeat(60),
          email: 'user@email.com',
          password: 'Password123*',
        },
      ];
      const errors = [
        await validateFirstError(data[0], CreateUserRequestDTO),
        await validateFirstError(data[1], CreateUserRequestDTO),
      ];

      expect(errors[0]).toHaveLength(0);
      expect(errors[1]).toHaveLength(0);
    });
  });

  describe('email', () => {
    it.each(TestUserData.getEmailErrorDataList('create'))(
      'should fail validation when email is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('email');
        expect(errors[0].value).toEqual(data.email);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('Should validate email up to max length', async () => {
      const data = {
        name: 'User 1',
        email: 'x'.repeat(50) + '@email.com',
        password: 'Password123*',
      };
      const errors = await validateFirstError(data, CreateUserRequestDTO);

      expect(errors).toHaveLength(0);
    });
  });

  describe('password', () => {
    it.each(TestUserData.getPasswordErrorDataList('create'))(
      'should fail validation when password is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('password');
        expect(errors[0].value).toEqual(data.password);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('Should validate passwords wwith valid lenght', async () => {
      const data = [
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Abc12*',
        },
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Abc12*' + 'x'.repeat(6),
        },
      ];
      const errors = [
        await validateFirstError(data[0], CreateUserRequestDTO),
        await validateFirstError(data[1], CreateUserRequestDTO),
      ];

      expect(errors[0]).toHaveLength(0);
      expect(errors[1]).toHaveLength(0);
    });
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const data = { name: 'User', email: 'email.com' };
      const errors = await validateFirstError(data, CreateUserRequestDTO);

      expect(errors).toHaveLength(3);
      expect(errors[0].constraints).toEqual({
        minLength: NameMessage.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isEmail: EmailMessage.INVALID });
    });
  });
});
