import { BoolMessage } from '../../../system/messages/bool/bool.messages';
import { EmailMessage } from '../../../system/messages/email/email.messages.enum';
import { TextMessage } from '../../../system/messages/text/text.messages';
import { validateFirstError } from '../../../system/utils/validation/validation';
import { UserConfigs } from '../../configs/user/user.configs';
import { UpdateUserRequestDTO } from './update-user.request.dto';

const { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH, NAME_MIN_LENGTH } = UserConfigs;

const validate = (data) => validateFirstError(data, UpdateUserRequestDTO);

async function testAccept(data) {
  const errors = await validateFirstError(data, UpdateUserRequestDTO);
  expect(errors).toHaveLength(0);
}

async function testReject(property, data, expectedErrors) {
  const errors = await validateFirstError(data, UpdateUserRequestDTO);
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toEqual(property);
  expect(errors[0].value).toEqual(data[property]);
  expect(errors[0].constraints).toEqual(expectedErrors);
}

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
    it(`should accept when name has min length`, async () => {
      await testAccept({ name: 'x'.repeat(NAME_MIN_LENGTH) });
    });

    it(`should accept when name has max length`, async () => {
      await testAccept({ name: 'x'.repeat(NAME_MAX_LENGTH) });
    });

    it(`should accept when name is undefined`, async () => {
      await testAccept({ name: undefined });
    });

    const NameMessage = new TextMessage('name', {
      minLength: NAME_MIN_LENGTH,
      maxLength: NAME_MAX_LENGTH,
    });

    it('should reject when name is number', async () => {
      await testReject(
        'name',
        { name: 2323232 },
        { isText: NameMessage.INVALID },
      );
    });

    it('should reject when name is boolean', async () => {
      await testReject('name', { name: true }, { isText: NameMessage.INVALID });
    });

    it('should reject when name is array', async () => {
      await testReject('name', { name: [] }, { isText: NameMessage.INVALID });
    });

    it('should reject when name is object', async () => {
      await testReject('name', { name: {} }, { isText: NameMessage.INVALID });
    });

    it('should reject when name is empty', async () => {
      await testReject('name', { name: '' }, { isText: NameMessage.MIN_LEN });
    });

    it('should reject when name is too short', async () => {
      await testReject('name', { name: '' }, { isText: NameMessage.MIN_LEN });
    });

    it('should reject when name is too long', async () => {
      await testReject(
        'name',
        { name: 'x'.repeat(NAME_MAX_LENGTH + 1) },
        { isText: NameMessage.MAX_LEN },
      );
    });

    it('should reject when name is null', async () => {
      await testReject('name', { name: null }, { isText: NameMessage.NULL });
    });
  });

  describe('email', () => {
    it(`should accept when email has min length`, async () => {
      await testAccept({ email: 'x@m.co' });
    });

    it(`should accept when email has max length`, async () => {
      await testAccept({
        email: 'x'.repeat(EMAIL_MAX_LENGTH - 10) + '@email.com',
      });
    });

    it(`should accept when email is undefined`, async () => {
      await testAccept({ email: undefined });
    });

    const Message = new TextMessage('email', {
      maxLength: EMAIL_MAX_LENGTH,
    });

    it('should reject when email is null', async () => {
      await testReject('email', { email: null }, { isText: Message.NULL });
    });

    it('should reject when email is number', async () => {
      await testReject(
        'email',
        { email: 2323232 },
        { isText: Message.INVALID },
      );
    });

    it('should reject when email is boolean', async () => {
      await testReject('email', { email: true }, { isText: Message.INVALID });
    });

    it('should reject when email is array', async () => {
      await testReject('email', { email: [] }, { isText: Message.INVALID });
    });

    it('should reject when email is object', async () => {
      await testReject('email', { email: {} }, { isText: Message.INVALID });
    });

    it('should reject when email has invalid format', async () => {
      await testReject(
        'email',
        { email: 'email.com' },
        { isText: Message.INVALID },
      );
    });

    it('should reject when email is too long', async () => {
      await testReject(
        'email',
        { email: 'x'.repeat(EMAIL_MAX_LENGTH + 1) },
        { isText: EmailMessage.MAX_LEN },
      );
    });

    it('should reject when email is null', async () => {
      await testReject('email', { email: null }, { isText: Message.NULL });
    });
  });

  describe('active', () => {
    const Messages = new BoolMessage('active');

    it('should accept when active is true', async () => {
      await testAccept({ active: true });
    });

    it('should accept when active is false', async () => {
      await testAccept({ active: false });
    });

    it('should accept when active is undefined', async () => {
      await testAccept({ active: undefined });
    });

    it('should reject when active is null', async () => {
      await testReject('active', { active: null }, { isBool: Messages.NULL });
    });

    it('should reject when active is number', async () => {
      await testReject('active', { active: 1 }, { isBool: Messages.INVALID });
    });

    it('should reject when active is string', async () => {
      await testReject(
        'active',
        { active: 'true' },
        { isBool: Messages.INVALID },
      );
    });

    it('should reject when active is array', async () => {
      await testReject('active', { active: [] }, { isBool: Messages.INVALID });
    });

    it('should reject when active is object', async () => {
      await testReject('active', { active: {} }, { isBool: Messages.INVALID });
    });
  });

  describe('multiple errors', () => {
    it('should reject in multiple fields', async () => {
      const ActiveMessage = new BoolMessage('active');
      const NameMessage = new TextMessage('name', {
        minLength: NAME_MIN_LENGTH,
        maxLength: NAME_MAX_LENGTH,
      });

      const data = {
        name: 'User',
        email: 'email.com',
        active: 'invalid',
      };
      const errors = await validate(data);

      expect(errors).toHaveLength(3);
      expect(errors[0].constraints).toEqual({ isText: NameMessage.MIN_LEN });
      expect(errors[1].constraints).toEqual({ isText: EmailMessage.INVALID });
      expect(errors[2].constraints).toEqual({ isBool: ActiveMessage.INVALID });
    });
  });
});
