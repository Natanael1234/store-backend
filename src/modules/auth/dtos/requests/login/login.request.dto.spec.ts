import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginRequestDto } from './login.request.dto';
import { log } from 'console';

describe('LoginRequestDto', () => {
  it('should pass validation', async () => {
    const dto = plainToInstance(LoginRequestDto, {
      email: 'user@email.com',
      password: '123456',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  describe('email', () => {
    it.each([
      {
        emailDescription: 'number',
        email: 2323232,
        expectedErrors: {
          isEmail: 'Email is invalid',
        },
      },
      {
        emailDescription: 'boolean',
        email: true,
        expectedErrors: {
          isEmail: 'Email is invalid',
        },
      },
      {
        emailDescription: 'array',
        email: [],
        expectedErrors: {
          isEmail: 'Email is invalid',
        },
      },
      {
        emailDescription: 'object',
        email: {},
        expectedErrors: {
          isEmail: 'Email is invalid',
        },
      },
      {
        emailDescription: 'null',
        email: null,
        expectedErrors: {
          isNotEmpty: 'Email is required',
          isEmail: 'Email is invalid',
        },
      },
      {
        emailDescription: 'undefined',
        email: undefined,
        expectedErrors: {
          isNotEmpty: 'Email is required',
          isEmail: 'Email is invalid',
        },
      },
      {
        emailDescription: 'empty',
        email: '',
        expectedErrors: {
          isNotEmpty: 'Email is required',
          isEmail: 'Email is invalid',
        },
      },
      {
        emailDescription: 'invalid formated',
        email: 'email.com',
        expectedErrors: {
          isEmail: 'Email is invalid',
        },
      },
    ])(
      'should fail validation when Email is $emailDescription',
      async ({ email, expectedErrors }) => {
        const data = {
          email,
          password: '123456',
        };
        const dto = plainToInstance(LoginRequestDto, data);
        const errors = await validate(dto);
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
          isString: 'Password must be a string',
          minLength: 'Password must be at least 6 characters long',
        },
      },
      {
        passwordDescription: 'boolean',
        password: true,
        expectedErrors: {
          isString: 'Password must be a string',
          minLength: 'Password must be at least 6 characters long',
        },
      },
      {
        passwordDescription: 'array',
        password: [],
        expectedErrors: {
          isString: 'Password must be a string',
          minLength: 'Password must be at least 6 characters long',
        },
      },
      {
        passwordDescription: 'object',
        password: {},
        expectedErrors: {
          isString: 'Password must be a string',
          minLength: 'Password must be at least 6 characters long',
        },
      },
      {
        passwordDescription: 'null',
        password: null,
        expectedErrors: {
          isNotEmpty: 'Password is required',
          isString: 'Password must be a string',
          minLength: 'Password must be at least 6 characters long',
        },
      },
      {
        passwordDescription: 'undefined',
        password: undefined,
        expectedErrors: {
          isNotEmpty: 'Password is required',
          isString: 'Password must be a string',
          minLength: 'Password must be at least 6 characters long',
        },
      },
      {
        passwordDescription: 'empty',
        password: '',
        expectedErrors: {
          isNotEmpty: 'Password is required',
          minLength: 'Password must be at least 6 characters long',
        },
      },
      {
        passwordDescription: 'too short',
        password: '123',
        expectedErrors: {
          minLength: 'Password must be at least 6 characters long',
        },
      },
    ])(
      'should fail validation when password is $passwordDescription',
      async ({ password, expectedErrors }) => {
        const data = {
          email: 'user@email.com',
          password,
        };
        const dto = plainToInstance(LoginRequestDto, data);
        const errors = await validate(dto);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('password');
        expect(errors[0].value).toEqual(data.password);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );
  });

  it('should fail validation when both email and password is are invalid', async () => {
    const data = {
      email: '',
      password: '',
    };
    const dto = plainToInstance(LoginRequestDto, data);
    const errors = await validate(dto);
    expect(errors).toHaveLength(2);
    expect(errors[0].property).toEqual('email');
    expect(errors[0].value).toEqual(data.email);
    expect(errors[0].constraints).toEqual({
      isNotEmpty: 'Email is required',
      isEmail: 'Email is invalid',
    });
    expect(errors[1].property).toEqual('password');
    expect(errors[1].value).toEqual(data.password);
    expect(errors[1].constraints).toEqual({
      isNotEmpty: 'Password is required',
      minLength: 'Password must be at least 6 characters long',
    });
  });
});
