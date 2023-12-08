import { Role } from '../../../authentication/enums/role/role.enum';
import { BoolMessage } from '../../../system/messages/bool/bool.messages';
import { PasswordMessage } from '../../../system/messages/password/password.messages.enum';
import { TextMessage } from '../../../system/messages/text/text.messages';
import { validateFirstError } from '../../../system/utils/validation/validation';
import { UserConfigs } from '../../configs/user/user.configs';
import { RoleMessage } from '../../enums/messages/role/role.messages.enum';
import { CreateUserRequestDTO } from './create-user.request.dto';

const {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} = UserConfigs;

async function testAccept(data) {
  const errors = await validateFirstError(data, CreateUserRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(property, data, expectedErrors) {
  const errors = await validateFirstError(data, CreateUserRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

describe('CreateUserRequestDto', () => {
  it('should pass validation', async () => {
    const data = {
      name: 'User 1',
      email: 'user@email.com',
      password: 'Ab123*',
      roles: [Role.ADMIN],
    };
    const errors = await validateFirstError(data, CreateUserRequestDTO);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    const Message = new TextMessage('name', {
      minLength: NAME_MIN_LENGTH,
      maxLength: NAME_MAX_LENGTH,
    });

    it('Should accept when name has min length', async () => {
      await testAccept({
        name: 'x'.repeat(NAME_MIN_LENGTH),
        email: 'user@email.com',
        password: 'Ab123*',
        roles: [Role.ADMIN],
      });
    });

    it('Should accept when name has max length', async () => {
      await testAccept({
        name: 'x'.repeat(NAME_MAX_LENGTH),
        email: 'user@email.com',
        password: 'Ab123*',
        roles: [Role.ADMIN],
      });
    });

    it('should reject when name is empty', async () => {
      await testReject(
        'name',
        {
          name: '',
          email: 'user@email.com',
          password: 'Ab123*',
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
        },
        { isText: Message.REQUIRED },
      );
    });

    it('should reject when name is number', async () => {
      await testReject(
        'name',
        {
          name: 2323232,
          email: 'user@email.com',
          password: 'Ab123*',
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
        },
        { isText: Message.INVALID },
      );
    });
  });

  describe('email', () => {
    const Message = new TextMessage('email', {
      maxLength: EMAIL_MAX_LENGTH,
    });

    it('Should accept when email has min length', async () => {
      await testAccept({
        name: 'User Name',
        email: 'u@e.co',
        password: 'Ab123*',
        roles: [Role.ADMIN],
      });
    });

    it('Should accept when email has max length', async () => {
      await testAccept({
        name: 'User Name',
        email: 'x'.repeat(NAME_MAX_LENGTH - 10) + '@email.com',
        password: 'Ab123*',
        roles: [Role.ADMIN],
      });
    });

    it('should reject when email is number', async () => {
      await testReject(
        'email',
        {
          name: 'User Name',
          email: 2323232,
          password: 'Ab123*',
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
        },
        { isText: Message.INVALID },
      );
    });
  });

  describe('password', () => {
    const Message = new TextMessage('password', {
      minLength: 6,
      maxLength: 12,
    });

    it('Should accept when password has min length', async () => {
      await testAccept({
        name: 'User Name',
        email: 'user@email.com',
        password: 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4),
        roles: [Role.ADMIN],
      });
    });

    it('Should accept when password has max length', async () => {
      await testAccept({
        name: 'User Name',
        email: 'user@email.com',
        password: 'Ab123*' + 'x'.repeat(NAME_MIN_LENGTH - 6),
        roles: [Role.ADMIN],
      });
    });

    it('should reject when password is number', async () => {
      await testReject(
        'password',
        {
          name: 'User Name',
          email: 'user@email.com',
          password: 2323232,
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
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
          roles: [Role.ADMIN],
        },
        { isStrongPassword: PasswordMessage.INVALID },
      );
    });
  });

  describe('roles', () => {
    it('should accept when roles is [Role.ADMIN]', async () => {
      await testAccept({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ADMIN],
        active: true,
      });
    });

    it('should accept when roles is [Role.ROOT]', async () => {
      await testAccept({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      });
    });

    it('should accept when roles is [Role.USER]', async () => {
      await testAccept({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.USER],
        active: true,
      });
    });

    it('should accept when multiple roles', async () => {
      await testAccept({
        name: 'User name',
        email: 'user@email.com',
        password: 'Abc12*',
        roles: [Role.USER, Role.ADMIN, Role.ROOT],
        active: true,
      });
    });

    it('should reject when roles is null', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: null,
          active: true,
        },
        { isNotEmpty: RoleMessage.REQUIRED },
      );
    });

    it('should reject when roles is undefined', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: undefined,
          active: true,
        },
        { isNotEmpty: RoleMessage.REQUIRED },
      );
    });

    it('should reject when roles is number', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: 1,
          active: true,
        },
        { isArray: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is boolean', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: true,
          active: true,
        },
        { isArray: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is string', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: 'invalid',
          active: true,
        },
        { isArray: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is object', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: {},
          active: true,
        },
        { isArray: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is array containing invalid string', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: ['invalid'],
          active: true,
        },
        { isEnum: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is array containing number', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: [1],
          active: true,
        },
        { isEnum: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is array containing boolean', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: [true],
          active: true,
        },
        { isEnum: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is array containing array', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: [[]],
          active: true,
        },
        { isEnum: RoleMessage.INVALID },
      );
    });

    it('should reject when roles is empty array', async () => {
      await testReject(
        'roles',
        {
          name: 'User name',
          email: 'user@email.com',
          password: 'Abc12*',
          roles: [{}],
          active: true,
        },
        { isEnum: RoleMessage.INVALID },
      );
    });
  });

  describe('active', () => {
    const Messages = new BoolMessage('active');

    it('should accept when active is true', async () => {
      await testAccept({
        name: 'User 1',
        email: 'user@email.com',
        password: 'Ab123*',
        roles: [Role.ADMIN],
        active: true,
      });
    });

    it('should accept when active is false', async () => {
      await testAccept({
        name: 'User 1',
        email: 'user@email.com',
        password: 'Ab123*',
        roles: [Role.ADMIN],
        active: false,
      });
    });

    it('should accept when active is undefined', async () => {
      await testAccept({
        name: 'User 1',
        email: 'user@email.com',
        password: 'Ab123*',
        roles: [Role.ADMIN],
        active: undefined,
      });
    });

    it('should reject when active is null', async () => {
      await testReject(
        'active',
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Ab123*',
          roles: [Role.ADMIN],
          active: null,
        },
        { isBool: Messages.NULL },
      );
    });

    it('should reject when active is number', async () => {
      await testReject(
        'active',
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Ab123*',
          roles: [Role.ADMIN],
          active: 1,
        },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is string', async () => {
      await testReject(
        'active',
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Ab123*',
          roles: [Role.ADMIN],
          active: 'true',
        },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject(
        'active',
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Ab123*',
          roles: [Role.ADMIN],
          active: [],
        },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is object', async () => {
      await testReject(
        'active',
        {
          name: 'User 1',
          email: 'user@email.com',
          password: 'Ab123*',
          roles: [Role.ADMIN],
          active: {},
        },
        { isBool: Messages.INVALID },
      );
    });
  });
  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const NameMessage = new TextMessage('name', {
        minLength: NAME_MIN_LENGTH,
        maxLength: NAME_MAX_LENGTH,
      });
      const EmailMessage = new TextMessage('email', {
        maxLength: EMAIL_MAX_LENGTH,
      });
      const PasswordMessage = new TextMessage('password', {
        minLength: PASSWORD_MIN_LENGTH,
        maxLength: EMAIL_MAX_LENGTH,
      });

      const data = {
        name: 'User',
        email: 'email.com',
        passord: null,
        roles: [],
      };
      const errors = await validateFirstError(data, CreateUserRequestDTO);

      expect(errors).toHaveLength(4);
      expect(errors[0].constraints).toEqual({
        isText: NameMessage.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isText: EmailMessage.INVALID });
      expect(errors[2].constraints).toEqual({
        isText: PasswordMessage.REQUIRED,
      });
      expect(errors[3].constraints).toEqual({
        arrayMinSize: RoleMessage.MIN_LEN,
      });
    });
  });
});
