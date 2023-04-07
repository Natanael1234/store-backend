import { UpdateUserRequestDTO } from './update-user.request.dto';
import { validateFirstError } from '../../../system/utils/validation';
import { NameMessage } from '../../enums/name-messages/name-messages.enum';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';

const validate = (data) => validateFirstError(data, UpdateUserRequestDTO);

describe('UpdateUserRequestDto', () => {
  it('should pass validation', async () => {
    const data = {
      name: 'User 1',
      email: 'user@email.com',
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
        nameDescription: 'empty',
        name: '',
        expectedErrors: {
          minLength: NameMessage.MIN_LEN,
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
        },
        {
          name: 'User 2',
          email: 'user@email.com',
        },
        {
          name: 'User ' + '3'.repeat(55),
          email: 'user@email.com',
        },
        {
          name: 'User ' + 'x'.repeat(56),
          email: 'user@email.com',
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
        emailDescription: 'empty',
        email: '',
        expectedErrors: {
          isEmail: EmailMessage.INVALID,
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
        };
        const errors = await validate(data);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('email');
        expect(errors[0].value).toEqual(data.email);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('should only validate emails shorter than 60 characters.', async () => {
      const data = [
        {
          name: 'User 1',
          email: 'u'.repeat(50) + '@email.com',
        },
        {
          name: 'User 2',
          email: 'u'.repeat(51) + '@email.com',
        },
      ];

      const errors = [await validate(data[0]), await validate(data[1])];

      expect(errors[0]).toHaveLength(0);

      expect(errors[1]).toHaveLength(1);
      expect(errors[1][0].property).toEqual('email');
      expect(errors[1][0].value).toEqual(data[1].email);
      expect(errors[1][0].constraints).toEqual({
        maxLength: EmailMessage.MAX_LEN,
      });
    });
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const data = {
        name: 'User',
        email: 'email.com',
      };
      const errors = await validate(data);

      expect(errors).toHaveLength(2);
      expect(errors[0].constraints).toEqual({
        minLength: NameMessage.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isEmail: EmailMessage.INVALID });
    });
  });
});
('');
