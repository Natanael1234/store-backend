import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../../../.jest/test-config.module';
import { testValidateUsersWithPassword } from '../../../../../../test/user/test-user-utils';
import { Role } from '../../../../../authentication/enums/role/role.enum';
import { AuthenticationService } from '../../../../../authentication/services/authentication/authentication.service';
import { EncryptionService } from '../../../../../system/encryption/services/encryption/encryption.service';
import { ExceptionText } from '../../../../../system/messages/exception-text/exception-text.enum';

import { PasswordMessage as PasswordMessage2 } from '../../../../../system/messages/password/password.messages.enum';
import { TextMessage } from '../../../../../system/messages/text/text.messages';
import { UserConfigs } from '../../../../configs/user/user.configs';
import { UserConstants } from '../../../../constants/user/user-entity.constants';
import { UserMessage } from '../../../../enums/messages/user/user.messages.enum';
import { User } from '../../../../models/user/user.entity';
import { UserService } from '../../user.service';

const { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } = UserConfigs;

const PasswordMessage = new TextMessage('password', {
  minLength: PASSWORD_MIN_LENGTH,
  maxLength: PASSWORD_MAX_LENGTH,
});

describe('UserService (updatePassword)', () => {
  let module: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;
  let encryptionService: EncryptionService;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    module = await getTestingModule();
    userService = module.get<UserService>(UserService);
    authenticationService = module.get<AuthenticationService>(
      AuthenticationService,
    );
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  async function insertUsers(
    ...users: {
      name: string;
      email: string;
      password: string;
      active?: boolean;
      roles: Role[];
    }[]
  ): Promise<string[]> {
    const ids = [];
    for (const user of users) {
      const ret = await userRepo
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          name: user.name,
          email: user.email,
          hash: await encryptionService.encrypt(user.password),
          roles: user.roles,
          active: user.active,
        })
        .execute();
      ids.push(ret.identifiers[0].id);
    }
    return ids;
  }

  it('should update password', async () => {
    const password = 'NewPass123*';
    const [userId1, userId2, userId3] = await insertUsers(
      {
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abc12*',
        roles: [Role.ROOT],
        active: true,
      },
      {
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Xyz12*',
        roles: [Role.USER],
        active: false,
      },
      {
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Cba12*',
        roles: [Role.USER],
        active: false,
      },
    );
    const usersBefore = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .getMany();
    const ret = await userService.updatePassword(userId2, { password });
    const usersAfter = await userRepo
      .createQueryBuilder(UserConstants.USER)
      .addSelect(UserConstants.USER_HASH)
      .getMany();
    expect(ret).toEqual({ status: 'success' });
    expect(usersAfter.length).toEqual(usersBefore.length);
    expect(usersAfter[0]).toEqual(usersBefore[0]);
    expect({ ...usersAfter[1], hash: null, updated: null }).toEqual({
      ...usersBefore[1],
      hash: null,
      updated: null,
    });
    expect(usersAfter[2]).toEqual(usersBefore[2]);
    const decryptedPasword = await encryptionService.decrypt(
      usersAfter[1].hash,
    );
    expect(decryptedPasword).toEqual(password);
  });

  describe('userId', () => {
    it('should fail if userId is null', async () => {
      const [userId1, userId2, userId3] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Xyz12*',
          roles: [Role.USER],
          active: false,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Cba12*',
          roles: [Role.USER],
          active: false,
        },
      );

      const usersBefore = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      const fn = () =>
        userService.updatePassword(null, { password: 'New123*' });
      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      expect(usersAfter).toStrictEqual(usersBefore);
    });

    it('should fail if userId is undefined', async () => {
      await insertUsers(
        {
          name: 'User 1',
          password: 'Abc12*',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          password: 'Xyz12*',
          email: 'user2@email.com',
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 3',
          password: 'Cba12*',
          email: 'user3@email.com',
          roles: [Role.USER],
          active: true,
        },
      );
      const usersBefore = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      const fn = () =>
        userService.updatePassword(undefined, { password: 'New123*' });
      await expect(fn()).rejects.toThrow(BadRequestException);
      await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();

      expect(usersAfter).toStrictEqual(usersBefore);
    });

    it('should fail if user does not exists', async () => {
      const usersBefore = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      const fn = () =>
        userService.updatePassword('550e8400-e29b-41d4-a716-446655440000', {
          password: 'Abc12*',
        });
      await expect(fn()).rejects.toThrow(NotFoundException);
      await expect(fn()).rejects.toThrow(UserMessage.NOT_FOUND);
      const usersAfter = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();
      expect(usersAfter).toStrictEqual(usersBefore);
    });
  });

  describe('dto', () => {
    describe('password', () => {
      it('should accept when password has minimum allowed length', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          password: 'Abc12*',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          active: true,
        });
        const newPassword = 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4);
        const expectedResults = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: newPassword,
            roles: [Role.ROOT],
            active: true,
          },
        ];
        const ret = await userService.updatePassword(userId1, {
          password: newPassword,
        });
        expect(ret).toEqual({ status: 'success' });
        const users = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();

        await testValidateUsersWithPassword(
          users,
          expectedResults,
          encryptionService,
        );
      });

      it('should accept when password has maximum allowed length', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          password: 'Abc12*',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          active: true,
        });
        const newPassword = 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4);
        const expectedResults = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: newPassword,
            roles: [Role.ROOT],
            active: true,
          },
        ];
        const ret = await userService.updatePassword(userId1, {
          password: newPassword,
        });
        expect(ret).toEqual({ status: 'success' });
        const users = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();

        await testValidateUsersWithPassword(
          users,
          expectedResults,
          encryptionService,
        );
      });

      it('should fail when password shorter than allowed', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          password: 'Abc12*',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          active: true,
        });
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId1, {
            password: 'Ab1*' + 'x'.repeat(PASSWORD_MIN_LENGTH - 4 - 1),
          });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.MIN_LEN },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password longer than allowed', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          password: 'Abc12*',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          active: true,
        });
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();

        const fn = () =>
          userService.updatePassword(userId1, {
            password: 'Ab1*' + 'x'.repeat(PASSWORD_MAX_LENGTH - 4 + 1),
          });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.MAX_LEN },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password is null', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId2, { password: null });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.NULL },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password is undefined', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();

        const fn = () =>
          userService.updatePassword(userId2, { password: undefined });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.REQUIRED },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password is number', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId2, {
            password: 1 as unknown as string,
          });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password is boolean', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();

        const fn = () =>
          userService.updatePassword(userId2, {
            password: true as unknown as string,
          });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password is array', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();

        const fn = () =>
          userService.updatePassword(userId2, {
            password: [] as unknown as string,
          });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password is object', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId2, {
            password: {} as unknown as string,
          });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password do not contains an lowwercase character', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId2, { password: 'ABC12*' });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage2.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password do not contains an uppercase character', async () => {
        const [userId1, userId2, userId3] = await insertUsers(
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Xyz12*',
            roles: [Role.USER],
            active: false,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Cba12*',
            roles: [Role.USER],
            active: false,
          },
        );
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId2, { password: 'abc12*' });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage2.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password do not contains an number character', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          password: 'Abc12*',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          active: true,
        });
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId1, { password: 'abcAB*' });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage2.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });

      it('should fail when password do not contains an special character', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          password: 'Abc12*',
          email: 'user1@email.com',
          roles: [Role.ROOT],
          active: true,
        });
        const usersBefore = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        const fn = () =>
          userService.updatePassword(userId1, { password: 'abc123' });
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
        const usersAfter = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .addSelect(UserConstants.USER_HASH)
          .getMany();
        await expect(fn()).rejects.toThrow(
          ExceptionText.UNPROCESSABLE__ENTITY__EXCEPTION,
        );
        try {
          await fn();
        } catch (ex) {
          expect(ex.getResponse()).toEqual({
            error: ExceptionText.UNPROCESSABLE_ENTITY_EXCEPTION,
            message: { password: PasswordMessage2.INVALID },
            statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          });
        }
        expect(usersAfter).toStrictEqual(usersBefore);
      });
    });
  });
});
