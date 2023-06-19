import { INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { getTestingModule } from '../src/.jest/test-config.module';
import { Role } from '../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../src/modules/authentication/services/authentication/authentication.service';
import { UserService } from '../src/modules/user/services/user/user.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userService: UserService;
  let authenticationService: AuthenticationService;

  beforeEach(async () => {
    moduleFixture = await getTestingModule();
    app = moduleFixture.createNestApplication();
    userService = app.get<UserService>(UserService);
    authenticationService = app.get<AuthenticationService>(
      AuthenticationService,
    );
    await app.init();
    // TODO: https://github.com/nestjs/nest/issues/5264
  });

  async function authenticationScenario(authenticated: boolean) {
    await userService.create({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      roles: [Role.ADMIN],
      active: true,
    });
    await userService.create({
      name: 'User 2',
      email: 'user2@email.com',
      password: 'Xyz789*',
      roles: [Role.ADMIN],
      active: true,
    });

    if (authenticated) {
      const authenticationRet = await authenticationService.login({
        email: 'user1@email.com',
        password: 'Abc12*',
      });
      return {
        refreshToken: authenticationRet.data.payload.token,
        token: authenticationRet.data.payload.refreshToken,
      };
    }
  }

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('/hello (GET)', () => {
    it('should succed when authorized', async () => {
      const { token } = await authenticationScenario(true);
      return request(app.getHttpServer())
        .get('/hello')
        .set('Authorization', 'bearer ' + token)
        .expect(200)
        .expect('Hello World!');
    });

    it('should fail when unauthorized', async () => {
      return request(app.getHttpServer()).get('/hello').expect(401);
    });
  });
});
