import { TestPurpose } from '../../../../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../../../../test/test-data/test-active-data';
import {
  getEmailAcceptableValues,
  getEmailErrorDataList,
} from '../../../../../../../test/test-data/test-email-data';
import {
  getNameAcceptableValues,
  getNameErrorDataList,
} from '../../../../../../../test/test-data/test-name-data';
import { getRolesErrorDataList } from '../../../../../../../test/test-data/test-roles-data';
import {
  getPasswordAcceptableValues,
  getPasswordErrorDataList,
} from '../../../../../../../test/test-data/test.password-data';
import { TestUserData } from '../../../../../../../test/user/test-user-data';
import { Role } from '../../../../../../authentication/enums/role/role.enum';
import { EmailMessage } from '../../../../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../../../../system/enums/messages/name-messages/name-messages.enum';
import { PasswordMessage } from '../../../../../../system/enums/messages/password-messages/password-messages.enum';
import { validateFirstError } from '../../../../../../system/utils/validation';
import { RoleMessage } from '../../../../../enums/messages/role/role-messages.enum';
import { CreateUserRequestDTO } from './create-user.request.dto';

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
    it.each(
      getNameErrorDataList({
        dtoData: TestUserData.creationData[2],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getNameAcceptableValues({
        dtoData: TestUserData.creationData[2],
        purpose: TestPurpose.create,
      }),
    )('Should validate when name is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateUserRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('email', () => {
    it.each(
      getEmailErrorDataList({
        dtoData: TestUserData.creationData[2],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail validation when email is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('email');
        expect(errors[0].value).toEqual(data.email);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getEmailAcceptableValues({
        dtoData: TestUserData.creationData[2],
        purpose: TestPurpose.create,
      }),
    )('Should validate when email is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateUserRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('password', () => {
    it.each(
      getPasswordErrorDataList({
        dtoData: TestUserData.creationData[2],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail validation when password is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('password');
        expect(errors[0].value).toEqual(data.password);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getPasswordAcceptableValues({
        dtoData: TestUserData.creationData[2],
        purpose: TestPurpose.create,
      }),
    )('Should validate when password is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateUserRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('roles', () => {
    it.each(
      getRolesErrorDataList({
        dtoData: TestUserData.creationData[2],
        purpose: TestPurpose.create,
      }),
    )(
      'should fail when roles is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('roles');
        expect(errors[0].value).toEqual(data.roles);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );
  });

  describe('active', () => {
    it.each(getActiveErrorDataList({ dtoData: TestUserData.creationData[2] }))(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, CreateUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getActiveAcceptableValues({ dtoData: TestUserData.creationData[2] }),
    )('should validate when active is $description', async ({ data }) => {
      const errors = await validateFirstError(data, CreateUserRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const data = {
        name: 'User',
        email: 'email.com',
        passord: null,
        roles: [],
      };
      const errors = await validateFirstError(data, CreateUserRequestDTO);

      expect(errors).toHaveLength(4);
      expect(errors[0].constraints).toEqual({
        minLength: NameMessage.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isEmail: EmailMessage.INVALID });
      expect(errors[2].constraints).toEqual({
        isNotEmpty: PasswordMessage.REQUIRED,
      });
      expect(errors[3].constraints).toEqual({
        arrayMinSize: RoleMessage.MIN_LEN,
      });
    });
  });
});
