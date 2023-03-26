import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LoginRequestDto } from './login.request.dto';

describe('LoginRequestDto', () => {
  it('should be defined', async () => {
    const dto = plainToInstance(LoginRequestDto, {
      email: null,
      password: null,
    });
    const validations = await validate(dto);
    expect(validations).toHaveLength(2);
    expect(validations);
    expect(validations[0].target).toBeDefined();
    expect(validations[0].property).toStrictEqual('email');
    expect(validations[0].value).toBeNull();
    expect(validations[0].constraints).toMatchObject({
      isEmail: 'email must be an email',
      isNotEmpty: 'A email is required',
    });
    expect(validations[1].constraints).toMatchObject({
      minLength: 'password must be longer than or equal to 8 characters',
      isString: 'password must be a string',
      isNotEmpty: 'A password is required to login',
    });
  });
});
