import { UnprocessableEntityException } from '@nestjs/common';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common/exceptions';
import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getTestingModule } from '../../../../.jest/test-config.module';
import { testValidateUsersWithPassword } from '../../../../test/user/test-user-utils';
import { EncryptionService } from '../../../system/encryption/services/encryption/encryption.service';
import { AuthorizationMessage } from '../../../system/messages/authorization/authorization.messages.enum';
import { EmailMessage } from '../../../system/messages/email/email.messages.enum';
import { NameMessage } from '../../../system/messages/name/name.messages.enum';
import { PasswordMessage } from '../../../system/messages/password/password.messages.enum';
import { UserConstants } from '../../../user/constants/user/user-entity.constants';
import { UserMessage } from '../../../user/enums/messages/user/user.messages.enum';
import { User } from '../../../user/models/user/user.entity';
import { UserService } from '../../../user/services/user/user.service';
import { Role } from '../../enums/role/role.enum';
import { CredentialsMessage } from '../../messages/cretentials/credentials.messages.enum';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { TokenService } from '../token/token.service';
import {
  testAuthenticationResponse,
  testDecodedAccessToken,
  testDistinctTokens,
} from './authentication-test-utils';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  let module: TestingModule;
  let authenticationService: AuthenticationService;
  let jwtService: JwtService;
  let userService: UserService;
  let refreshTokenRepo: RefreshTokenRepository;
  let userRepo: Repository<User>;
  let tokenService: TokenService;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    module = await getTestingModule();
    jwtService = module.get<JwtService>(JwtService);
    authenticationService = module.get<AuthenticationService>(
      AuthenticationService,
    );
    userService = module.get<UserService>(UserService);
    tokenService = module.get<TokenService>(TokenService);
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
    );
    refreshTokenRepo = module.get<RefreshTokenRepository>(
      RefreshTokenRepository,
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
  ) {
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

  describe('register', () => {
    it('should fail when user is inactive', async () => {});

    it('should register users', async () => {
      const registerResponseUser1 = await authenticationService.register({
        name: 'User 1',
        email: 'user1@email.com',
        password: 'Abcd1*',
        acceptTerms: true,
      });
      const registerResponseUser2 = await authenticationService.register({
        name: 'User 2',
        email: 'user2@email.com',
        password: 'Abcd2*',
        acceptTerms: true,
      });
      await userService.create({
        name: 'User 3',
        email: 'user3@email.com',
        password: 'Abcd3*',
        roles: [Role.ADMIN],
        active: false,
      });
      const registerResponseUser4 = await authenticationService.register({
        name: 'User 4',
        email: 'user4@email.com',
        password: 'Abcd4*',
        acceptTerms: true,
      });

      const repositoryRefreshTokens = await refreshTokenRepo.find();
      expect(repositoryRefreshTokens).toHaveLength(3);
      expect(repositoryRefreshTokens[0].userId).toEqual(
        registerResponseUser1.data.user.id,
      );
      expect(repositoryRefreshTokens[1].userId).toEqual(
        registerResponseUser2.data.user.id,
      );
      expect(repositoryRefreshTokens[2].userId).toEqual(
        registerResponseUser4.data.user.id,
      );

      const repositoryUsers = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .addSelect(UserConstants.USER_HASH)
        .getMany();

      await testValidateUsersWithPassword(
        repositoryUsers,
        [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abcd1*',
            roles: [Role.ROOT],
            active: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abcd2*',
            roles: [Role.USER],
            active: true,
          },
          {
            name: 'User 3',
            email: 'user3@email.com',
            password: 'Abcd3*',
            roles: [Role.ADMIN],
            active: false,
          },
          {
            name: 'User 4',
            email: 'user4@email.com',
            password: 'Abcd4*',
            roles: [Role.USER],
            active: true,
          },
        ],
        encryptionService,
      );

      const user = await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .getMany();

      // TODO: verificar se pode usar o user id dos registerResponseUser
      testAuthenticationResponse(jwtService, registerResponseUser1, {
        id: user[0].id,
        name: 'User 1',
        email: 'user1@email.com',
        active: true,
      });
      testAuthenticationResponse(jwtService, registerResponseUser2, {
        id: user[1].id,
        name: 'User 2',
        email: 'user2@email.com',
        active: true,
      });
      testAuthenticationResponse(jwtService, registerResponseUser4, {
        id: user[3].id,
        name: 'User 4',
        email: 'user4@email.com',
        active: true,
      });

      // check if payloads are different
      testDistinctTokens(
        registerResponseUser1.data.payload,
        registerResponseUser2.data.payload,
      );
      testDistinctTokens(
        registerResponseUser1.data.payload,
        registerResponseUser4.data.payload,
      );
      testDistinctTokens(
        registerResponseUser2.data.payload,
        registerResponseUser4.data.payload,
      );
    });

    it('should fail when data is null', async () => {
      const fn = async () => await authenticationService.register(null);
      await expect(fn()).rejects.toThrow(UserMessage.DATA_REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });

    it('should fail when data is undefined', async () => {
      const fn = async () => await authenticationService.register(undefined);
      await expect(fn()).rejects.toThrow(UserMessage.DATA_REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });

    describe('name', () => {
      it('should fail when name is null', async () => {
        const fn = async () =>
          await authenticationService.register({
            name: null,
            email: 'user@email.com',
            password: 'Ab123*',
            acceptTerms: true,
          });

        await expect(fn()).rejects.toThrow(NameMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when name is undefined', async () => {
        const fn = async () =>
          await authenticationService.register({
            name: undefined,
            email: 'user@email.com',
            password: 'Ab123*',
            acceptTerms: true,
          });
        await expect(fn()).rejects.toThrow(NameMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('email', () => {
      it('should fail when email is already registered', async () => {
        const registerData = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            acceptTerms: true,
          },
        ];

        const response1 = await authenticationService.register(registerData[0]);
        const fn = async () =>
          await authenticationService.register({
            name: 'User Name',
            email: 'user1@email.com',
            password: 'Ab123*',
            acceptTerms: true,
          });

        await expect(fn()).rejects.toThrow(EmailMessage.INVALID);
        await expect(fn()).rejects.toThrow(ConflictException);
      });

      it('should fail when email is already registered for user is soft-deleted', async () => {
        const registerData = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            acceptTerms: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abc13*',
            acceptTerms: true,
          },
        ];

        await authenticationService.register({
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        });
        await authenticationService.register(registerData[1]);

        await userRepo
          .createQueryBuilder(UserConstants.USERS)
          .softDelete()
          .from(User)
          .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
          .execute();

        const fn = () => authenticationService.register(registerData[1]);
        await expect(fn()).rejects.toThrow(EmailMessage.INVALID);
        await expect(fn()).rejects.toThrow(ConflictException);
      });

      it('should fail when email is null', async () => {
        const fn = async () =>
          await authenticationService.register({
            name: 'User Name',
            email: null,
            password: 'Ab123*',
            acceptTerms: true,
          });
        await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is undefined', async () => {
        const fn = async () =>
          await authenticationService.register({
            name: 'User Name',
            email: undefined,
            password: 'Ab123*',
            acceptTerms: true,
          });
        await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('password', () => {
      it('should fail when password is null', async () => {
        const fn = async () =>
          await authenticationService.register({
            name: 'User Name',
            email: 'user@email.com',
            password: null,
            acceptTerms: true,
          });
        await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when password is undfined', async () => {
        const fn = async () =>
          await authenticationService.register({
            name: 'User Name',
            email: 'user@email.com',
            password: undefined,
            acceptTerms: true,
          });
        await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('acceptTerms', () => {
      it('should not fail when acceptTerms is null', async () => {
        // TODO: errado?
        const ret = await authenticationService.register({
          name: 'User Name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: null,
        });
        expect(ret).toBeDefined();
      });

      it('should not fail when acceptTerms is undefined', async () => {
        // TODO: errado?
        const ret = await authenticationService.register({
          name: 'User Name',
          email: 'user@email.com',
          password: 'Abc12*',
          acceptTerms: undefined,
        });
        expect(ret).toBeDefined();
      });
    });
  });

  describe('login', () => {
    it('should login', async () => {
      const [userId1, userId2, userId3, userId4, userId5] = await insertUsers(
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abcd*1',
          roles: [Role.ROOT],
          active: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abcd*2',
          roles: [Role.ADMIN],
          active: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abcd*3',
          roles: [Role.USER],
          active: true,
        },
        {
          name: 'User 4',
          email: 'user4@email.com',
          password: 'Abcd*4',
          roles: [Role.USER],
          active: true,
        },
      );

      const loginRet1 = await authenticationService.login({
        email: 'user2@email.com',
        password: 'Abcd*2',
      });

      const loginRet2 = await authenticationService.login({
        email: 'user3@email.com',
        password: 'Abcd*3',
      });

      // prevents tokens for the same user to be equal due to be generated at the same time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const loginRet3 = await authenticationService.login({
        email: 'user3@email.com',
        password: 'Abcd*3',
      });

      testAuthenticationResponse(jwtService, loginRet1, {
        id: userId2,
        name: 'User 2',
        email: 'user2@email.com',
        active: true,
      });
      testAuthenticationResponse(jwtService, loginRet2, {
        id: userId3,
        name: 'User 3',
        email: 'user3@email.com',
        active: true,
      });
      testAuthenticationResponse(jwtService, loginRet2, {
        id: userId3,
        name: 'User 3',
        email: 'user3@email.com',
        active: true,
      });

      testDistinctTokens(loginRet1.data.payload, loginRet2.data.payload);
      testDistinctTokens(loginRet1.data.payload, loginRet3.data.payload);
      testDistinctTokens(loginRet2.data.payload, loginRet3.data.payload);
    });

    it('should fail when login data is null', async () => {
      const loginData = null;
      const fn = () => authenticationService.login(loginData);
      await expect(fn()).rejects.toThrow(CredentialsMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });

    it('should fail when login data is undefined', async () => {
      const loginData = undefined;
      const fn = () => authenticationService.login(loginData);
      await expect(fn()).rejects.toThrow(CredentialsMessage.REQUIRED);
      await expect(fn()).rejects.toThrow(BadRequestException);
    });

    it('should fail when user is inactive', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];
      await authenticationService.register(registerData[0]);
      const user = await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user1@email.com' })
        .getOne();
      await userRepo.update(user.id, { active: false });

      const fn = () =>
        authenticationService.login({
          email: registerData[1].email,
          password: registerData[1].password,
        });
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when user is soft-deleted', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      const user = await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
        .getOne();
      await userRepo.softDelete(user.id);
      const fn = () =>
        authenticationService.login({
          email: registerData[1].email,
          password: registerData[1].password,
        });
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    describe('email', () => {
      it('should fail when email is null', async () => {
        const email = null;
        const fn = () =>
          authenticationService.login({ email, password: '123' });
        await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is undefined', async () => {
        const email = undefined;
        const fn = () =>
          authenticationService.login({ email, password: '123' });
        await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is empty string', async () => {
        const email = '';
        const fn = () =>
          authenticationService.login({ email, password: '123' });
        await expect(fn()).rejects.toThrow(EmailMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is not found', async () => {
        const registerData = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            acceptTerms: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abc13*',
            acceptTerms: true,
          },
        ];
        await authenticationService.register(registerData[0]);
        await authenticationService.register(registerData[1]);
        const fn = () =>
          authenticationService.login({
            email: 'inexistentuser@email.com',
            password: '123',
          });
        await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
        await expect(fn()).rejects.toThrow(UnauthorizedException);
      });
    });

    describe('password', () => {
      it('should fail when email is null', async () => {
        const registerData = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            acceptTerms: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abc13*',
            acceptTerms: true,
          },
        ];

        const fn = () =>
          authenticationService.login({
            email: registerData[1].email,
            password: null,
          });
        await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is undefined', async () => {
        const registerData = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            acceptTerms: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abc13*',
            acceptTerms: true,
          },
        ];

        const fn = () =>
          authenticationService.login({
            email: registerData[1].email,
            password: undefined,
          });
        await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when email is empty string', async () => {
        const registerData = [
          {
            name: 'User 1',
            email: 'user1@email.com',
            password: 'Abc12*',
            acceptTerms: true,
          },
          {
            name: 'User 2',
            email: 'user2@email.com',
            password: 'Abc13*',
            acceptTerms: true,
          },
        ];

        const fn = () =>
          authenticationService.login({
            email: registerData[1].email,
            password: '',
          });
        await expect(fn()).rejects.toThrow(PasswordMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    it('should fail when password is wrong', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];
      await authenticationService.register(registerData[0]);
      await authenticationService.register(registerData[1]);
      const fn = () =>
        authenticationService.login({
          email: registerData[1].email,
          password: 'wrong_password',
        });
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('should refresh login', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const users = await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .getMany();

      const refreshResponses = [
        await authenticationService.refresh(
          registerResponses[0].data.payload.refreshToken,
        ),
        await authenticationService.refresh(
          registerResponses[1].data.payload.refreshToken,
        ),
        await authenticationService.refresh(
          registerResponses[1].data.payload.refreshToken,
        ),
      ];

      const decodedAccessTokens = [
        await jwtService.decode(refreshResponses[0].data.payload.token),
        await jwtService.decode(refreshResponses[1].data.payload.token),
        await jwtService.decode(refreshResponses[2].data.payload.token),
      ];

      testDecodedAccessToken(decodedAccessTokens[0], users[0].id);
      testDecodedAccessToken(decodedAccessTokens[1], users[1].id);
      testDecodedAccessToken(decodedAccessTokens[2], users[1].id);
    });

    it('should fail when refresh token is null', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const refreshToken = null;

      await authenticationService.register(registerData[0]);
      const fn = async () => await authenticationService.refresh(refreshToken);
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is undefined', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const refreshToken = undefined;

      await authenticationService.register(registerData[0]);
      const fn = async () => await authenticationService.refresh(refreshToken);
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is empty string', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const refreshToken = '';

      await authenticationService.register(registerData[0]);
      const fn = async () => await authenticationService.refresh(refreshToken);
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is invalid', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      await authenticationService.register(registerData[0]);
      const fn = async () =>
        await authenticationService.refresh('invalid_refresh_token');
      await expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is blacklisted', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const registered = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
      ];

      await tokenService.revokeRefreshToken(
        registered[1].data.payload.refreshToken,
      );

      const refreshed = await authenticationService.refresh(
        registered[0].data.payload.refreshToken,
      );

      expect(refreshed).toBeDefined();

      const fn = async (refreshToken) =>
        await authenticationService.refresh(refreshToken);
      await expect(fn(registered[1].data.payload.refreshToken)).rejects.toThrow(
        AuthorizationMessage.NOT_AUTORIZED,
      );
      await expect(fn(registered[1].data.payload.refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should fail when user is inactive', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const registered = await authenticationService.register(registerData[0]);
      const user = await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user1@email.com' })
        .getOne();

      await userRepo.update(user.id, { active: false });
      const fn = () =>
        authenticationService.refresh(registered.data.payload.refreshToken);
      expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      expect(fn()).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const registered = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
      ];

      await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .softDelete()
        .from(User)
        .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
        .execute();

      const fn = () =>
        authenticationService.refresh(registered[1].data.payload.refreshToken);
      expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      expect(fn()).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abc14*',
          acceptTerms: true,
        },
      ];

      const registered = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];

      const logoutsResults = [
        await authenticationService.logout(
          registered[1].data.payload.refreshToken,
        ),
      ];

      const refreshTokens = await refreshTokenRepo.find();

      expect(logoutsResults[0]).toEqual({ status: 'success' });
      expect(refreshTokens).toHaveLength(3);
      expect(refreshTokens[0].revoked).toEqual(false);
      expect(refreshTokens[1].revoked).toEqual(true);
      expect(refreshTokens[2].revoked).toEqual(false);
    });

    it('should fail when refresh token is null', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const refreshToken = null;

      await authenticationService.register(registerData[0]);
      const fn = async () => authenticationService.logout(refreshToken);
      await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is undefined', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const refreshToken = undefined;

      await authenticationService.register(registerData[0]);
      const fn = async () => authenticationService.logout(refreshToken);
      await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is empty string', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
      ];

      const refreshToken = '';

      await authenticationService.register(registerData[0]);
      const fn = async () => authenticationService.logout(refreshToken);
      await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when user is inactive', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abc14*',
          acceptTerms: true,
        },
      ];

      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      const user = await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
        .getOne();
      await userRepo.update(user.id, { active: false });

      const fn = async () =>
        authenticationService.logout(
          registerResponses[1].data.payload.refreshToken,
        );
      await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is blacklisted', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
        {
          name: 'User 3',
          email: 'user3@email.com',
          password: 'Abc14*',
          acceptTerms: true,
        },
      ];

      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];

      await tokenService.revokeRefreshToken(
        registerResponses[1].data.payload.refreshToken,
      );

      const fn = async () =>
        authenticationService.logout(
          registerResponses[1].data.payload.refreshToken,
        );
      await expect(fn).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      await expect(fn).rejects.toThrow(UnauthorizedException);
    });

    it('should fail when refresh token is user is soft-deleted', async () => {
      const registerData = [
        {
          name: 'User 1',
          email: 'user1@email.com',
          password: 'Abc12*',
          acceptTerms: true,
        },
        {
          name: 'User 2',
          email: 'user2@email.com',
          password: 'Abc13*',
          acceptTerms: true,
        },
        {
          name: 'User 4',
          email: 'user3@email.com',
          password: 'Abc14*',
          acceptTerms: true,
        },
      ];
      const registerResponses = [
        await authenticationService.register(registerData[0]),
        await authenticationService.register(registerData[1]),
        await authenticationService.register(registerData[2]),
      ];
      await userRepo
        .createQueryBuilder(UserConstants.USERS)
        .softDelete()
        .where(UserConstants.EMAIL_EQUALS_TO, { email: 'user2@email.com' })
        .execute();
      const fn = async () =>
        authenticationService.logout(
          registerResponses[1].data.payload.refreshToken,
        );
      expect(fn()).rejects.toThrow(AuthorizationMessage.NOT_AUTORIZED);
      expect(fn()).rejects.toThrow(UnauthorizedException);
      // TODO: deveria retornar null
    });
  });

  describe('buildResponsePayload', () => {
    it('should build response payload', async () => {
      const [userId1] = await insertUsers({
        name: 'User 1',
        email: 'user1#email.com',
        password: 'Abcd*1',
        roles: [Role.ADMIN],
        active: true,
      });
      const user = await userRepo
        .createQueryBuilder(UserConstants.USER)
        .where(UserConstants.USER_ID_EQUALS_TO, { userId: userId1 })
        .getOne();

      const token = 'accessToken';
      const refreshToken = 'refreshToken';
      const responsePayload = await authenticationService[
        'buildResponsePayload'
      ](user, token, refreshToken);
      expect(responsePayload).toMatchObject({
        user,
        payload: { type: 'bearer', token, refreshToken },
      });
    });

    describe(UserConstants.USERS, () => {
      it('should fail when user is null', async () => {
        const fn = async () => {
          const user = null;
          await authenticationService['buildResponsePayload'](
            user,
            'accessToken',
            'refreshToken',
          );
        };
        await expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when user is undefined', async () => {
        const fn = async () => {
          const user = undefined;
          await authenticationService['buildResponsePayload'](
            user,
            'accessToken',
            'refreshToken',
          );
        };
        await expect(fn()).rejects.toThrow(UserMessage.REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when user id is not defined', async () => {
        const fn = async () => {
          await authenticationService['buildResponsePayload'](
            new User(),
            'accessToken',
            'refreshToken',
          );
        };
        await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });
    });

    describe('access token', () => {
      it('should fail when access token is null', async () => {
        const accessToken = null;
        const fn = async () => {
          await authenticationService['buildResponsePayload'](
            new User(),
            accessToken,
            'refreshToken',
          );
        };
        await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException); // TODO: verificar se está correto. Deveria ser erro do access token e não do id de usuário.
      });

      it('should fail when access token is undefined', async () => {
        const accessToken = undefined;
        const fn = async () => {
          await authenticationService['buildResponsePayload'](
            new User(),
            accessToken,
            'refreshToken',
          );
        };
        await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED); // TODO: verificar se está correto. Deveria ser erro do access token e não do id de usuário.
        await expect(fn()).rejects.toThrow(UnprocessableEntityException);
      });

      it('should fail when access token is empty string', async () => {
        const accessToken = '';
        const fn = async () => {
          await authenticationService['buildResponsePayload'](
            new User(),
            accessToken,
            'refreshToken',
          );
        };
        await expect(fn()).rejects.toThrow(UserMessage.ID_REQUIRED);
        await expect(fn()).rejects.toThrow(UnprocessableEntityException); // TODO: verificar se está correto. Deveria ser erro do access token e não do id de usuário.
      });
    });

    describe('refresh token', () => {
      it('should build response payload when refresh token is null', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          email: 'user1#email.com',
          password: 'Abcd*1',
          roles: [Role.ADMIN],
          active: true,
        });
        const user = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .where(UserConstants.USER_ID_EQUALS_TO, { userId: userId1 })
          .getOne();
        const token = 'accessToken';
        const refreshToken = null;
        const responsePayload = await authenticationService[
          'buildResponsePayload'
        ](user, token, refreshToken);
        expect(responsePayload).toMatchObject({
          user,
          payload: { type: 'bearer', token },
        });
      });

      it('should build response payload when refresh token is undefined', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          email: 'user1#email.com',
          password: 'Abcd*1',
          roles: [Role.ADMIN],
          active: true,
        });
        const user = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .where(UserConstants.USER_ID_EQUALS_TO, { userId: userId1 })
          .getOne();
        const refreshToken = undefined;
        const token = 'accessToken';
        const responsePayload = await authenticationService[
          'buildResponsePayload'
        ](user, token, refreshToken);
        expect(responsePayload).toMatchObject({
          user,
          payload: { type: 'bearer', token },
        });
      });

      it('should build response payload when refresh token is empty string', async () => {
        const [userId1] = await insertUsers({
          name: 'User 1',
          email: 'user1#email.com',
          password: 'Abcd*1',
          roles: [Role.ADMIN],
          active: true,
        });

        const user = await userRepo
          .createQueryBuilder(UserConstants.USER)
          .where(UserConstants.USER_ID_EQUALS_TO, { userId: userId1 })
          .getOne();
        const refreshToken = '';
        const token = 'accessToken';
        const responsePayload = await authenticationService[
          'buildResponsePayload'
        ](user, token, refreshToken);
        expect(responsePayload).toMatchObject({
          user,
          payload: { type: 'bearer', token },
        });
      });
    });
  });
});
