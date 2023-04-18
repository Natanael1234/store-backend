import { TestUserData } from '../../../../test/test-user-data';
import { Role } from '../../../authentication/enums/role/role.enum';
import { validateFirstError } from '../../../system/utils/validation';
import { EmailMessage } from '../../enums/email-messages/email-messages.enum';
import { NameMessage } from '../../enums/name-messages/name-messages.enum';
import { RoleMessage } from '../../enums/role-messages/role-messages.enum';
import { UpdateUserRequestDTO } from './update-user.request.dto';

const validate = (data) => validateFirstError(data, UpdateUserRequestDTO);

describe('UpdateUserRequestDto', () => {
  it('should pass validation', async () => {
    const data = {
      name: 'User 1',
      email: 'user@email.com',
      roles: [Role.ADMIN],
    };
    const errors = await validate(data);
    expect(errors).toHaveLength(0);
  });

  describe('name', () => {
    it.each(TestUserData.getNameErrorDataList('update'))(
      'should fail validation when name is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validate(data);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('name');
        expect(errors[0].value).toEqual(data.name);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('Should validate when name length is valid', async () => {
      const data = [
        {
          name: 'User 2',
          email: 'user@email.com',
          roles: [Role.ADMIN],
        },
        {
          name: 'x'.repeat(60),
          email: 'user@email.com',
          roles: [Role.ADMIN],
        },
      ];
      const errors = [await validate(data[0]), await validate(data[1])];

      expect(errors[0]).toHaveLength(0);
      expect(errors[1]).toHaveLength(0);
    });
  });

  describe('email', () => {
    it.each(TestUserData.getEmailErrorDataList('update'))(
      'should fail validation when email is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validate(data);

        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('email');
        expect(errors[0].value).toEqual(data.email);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it('should validate when email length is valid', async () => {
      const data = {
        name: 'User 1',
        email: 'u'.repeat(50) + '@email.com',
        roles: [Role.ADMIN],
      };

      const errors = await validate(data);

      expect(errors).toHaveLength(0);
    });
  });

  describe('roles', () => {
    it.each(TestUserData.getRolesErrorDataList('update'))(
      'should fail when roles is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('roles');
        expect(errors[0].value).toEqual(data.roles);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const data = {
        name: 'User',
        email: 'email.com',
        roles: [],
      };
      const errors = await validate(data);

      expect(errors).toHaveLength(3);
      expect(errors[0].constraints).toEqual({
        minLength: NameMessage.MIN_LEN,
      });
      expect(errors[1].constraints).toEqual({ isEmail: EmailMessage.INVALID });
      expect(errors[2].constraints).toEqual({
        arrayMinSize: RoleMessage.MIN_LEN,
      });
    });
  });
});
