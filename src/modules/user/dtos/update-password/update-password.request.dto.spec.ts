import { PasswordMessage } from '../../../system/messages/password/password.messages.enum';
import { TextMessage } from '../../../system/messages/text/text.messages';
import { validateFirstError } from '../../../system/utils/validation/validation';
import { UserConfigs } from '../../configs/user/user.configs';
import { UpdatePasswordRequestDTO } from './update-password.request.dto';

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = UserConfigs;

async function testAccept(data) {
  const errors = await validateFirstError(data, UpdatePasswordRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(property, data, expectedErrors) {
  const errors = await validateFirstError(data, UpdatePasswordRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

describe('CreateUserRequestDto', () => {
  const Message = new TextMessage('password', {
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
  });

  it('Should accept when password has min length', async () => {
    await testAccept({ password: 'Ab123*' });
  });

  it('Should accept when password has max length', async () => {
    await testAccept({
      password: 'Ab123*' + 'x'.repeat(PASSWORD_MIN_LENGTH),
    });
  });

  it('should reject when password is number', async () => {
    await testReject(
      'password',
      { password: 2323232 },
      { isText: Message.INVALID },
    );
  });

  it('should reject when password is boolean', async () => {
    await testReject(
      'password',
      { password: true },
      { isText: Message.INVALID },
    );
  });

  it('should reject when password is array', async () => {
    await testReject('password', { password: [] }, { isText: Message.INVALID });
  });

  it('should reject when password is object', async () => {
    await testReject('password', { password: {} }, { isText: Message.INVALID });
  });

  it('should reject when password is empty', async () => {
    await testReject('password', { password: '' }, { isText: Message.MIN_LEN });
  });

  it('should reject when password too short', async () => {
    await testReject(
      'password',
      { password: 'Ab12*' },
      { isText: Message.MIN_LEN },
    );
  });

  it('should reject when password is too long', async () => {
    await testReject(
      'password',
      { password: 'Ab123*' + 'x'.repeat(7) },
      { isText: Message.MAX_LEN },
    );
  });

  it('should reject when password is null', async () => {
    await testReject('password', { password: null }, { isText: Message.NULL });
  });

  it('should reject when password is undefined', async () => {
    await testReject(
      'password',
      { password: undefined },
      { isText: Message.REQUIRED },
    );
  });

  it('should reject when password is missing uppercase letter', async () => {
    await testReject(
      'password',
      { password: 'ab123*' },
      { isStrongPassword: PasswordMessage.INVALID },
    );
  });

  it('should reject when password is missing lowercase letter', async () => {
    await testReject(
      'password',
      { password: 'AB123*' },
      { isStrongPassword: PasswordMessage.INVALID },
    );
  });

  it('should reject when password is missing lowercase letter', async () => {
    await testReject(
      'password',
      { password: 'AB123*' },
      { isStrongPassword: PasswordMessage.INVALID },
    );
  });

  it('should reject when password is missing number', async () => {
    await testReject(
      'password',
      { password: 'ABcde*' },
      { isStrongPassword: PasswordMessage.INVALID },
    );
  });

  it('should reject when password is missing special character', async () => {
    await testReject(
      'password',
      { password: 'AB1234' },
      { isStrongPassword: PasswordMessage.INVALID },
    );
  });
});
