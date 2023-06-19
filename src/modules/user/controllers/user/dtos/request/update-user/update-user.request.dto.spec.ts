import { TestBrandData } from '../../../../../../../test/brand/test-brand-data';
import { TestPurpose } from '../../../../../../../test/test-data';
import {
  getActiveAcceptableValues,
  getActiveErrorDataList,
} from '../../../../../../../test/test-data/test-active-data';
import { getEmailErrorDataList } from '../../../../../../../test/test-data/test-email-data';
import { getNameErrorDataList } from '../../../../../../../test/test-data/test-name-data';
import { TestUserData } from '../../../../../../../test/user/test-user-data';
import { ActiveMessage } from '../../../../../../system/enums/messages/active-messages/active-messages.enum';
import { EmailMessage } from '../../../../../../system/enums/messages/email-messages/email-messages.enum';
import { NameMessage } from '../../../../../../system/enums/messages/name-messages/name-messages.enum';
import { validateFirstError } from '../../../../../../system/utils/validation';
import { UpdateUserRequestDTO } from './update-user.request.dto';

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
    it.each(
      getNameErrorDataList({
        dtoData: TestUserData.updateData[2],
        purpose: TestPurpose.update,
      }),
    )(
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
        },
        {
          name: 'x'.repeat(60),
          email: 'user@email.com',
        },
      ];
      const errors = [await validate(data[0]), await validate(data[1])];

      expect(errors[0]).toHaveLength(0);
      expect(errors[1]).toHaveLength(0);
    });
  });

  describe('email', () => {
    it.each(
      getEmailErrorDataList({
        dtoData: TestUserData.updateData[2],
        purpose: TestPurpose.update,
      }),
    )(
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
      };

      const errors = await validate(data);

      expect(errors).toHaveLength(0);
    });
  });

  describe('active', () => {
    it.each(
      getActiveErrorDataList({ dtoData: TestBrandData.dataForRepository[1] }),
    )(
      'should fail when active is $description',
      async ({ data, expectedErrors }) => {
        const errors = await validateFirstError(data, UpdateUserRequestDTO);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toEqual('active');
        expect(errors[0].value).toEqual(data.active);
        expect(errors[0].constraints).toEqual(expectedErrors);
      },
    );

    it.each(
      getActiveAcceptableValues({
        dtoData: TestBrandData.dataForRepository[1],
      }),
    )('should validate when active is $description', async ({ data }) => {
      const errors = await validateFirstError(data, UpdateUserRequestDTO);
      expect(errors).toHaveLength(0);
    });
  });

  describe('multiple errors', () => {
    it('should fail in multiple fields', async () => {
      const data = {
        name: 'User',
        email: 'email.com',
        active: 'error',
      };
      const errors = await validate(data);

      expect(errors).toHaveLength(3);
      expect(errors[0].constraints).toEqual({ minLength: NameMessage.MIN_LEN });
      expect(errors[1].constraints).toEqual({ isEmail: EmailMessage.INVALID });
      expect(errors[2].constraints).toEqual({ isBool: ActiveMessage.TYPE });
    });
  });
});