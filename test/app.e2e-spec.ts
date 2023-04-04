import { TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getTestingModule } from '../src/.jest/test-config.module';
import { UserService } from '../src/modules/user/services/user/user.service';
import { AuthService } from '../src/modules/auth/services/auth/auth.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let userService: UserService;
  let authService: AuthService;

  beforeEach(async () => {
    moduleFixture = await getTestingModule({
      // imports: [AppModule],
      // controllers: [AppController],
    });
    app = moduleFixture.createNestApplication();
    userService = app.get<UserService>(UserService);
    authService = app.get<AuthService>(AuthService);
    await app.init();
    // TODO: https://github.com/nestjs/nest/issues/5264
  });

  async function authenticationScenario(authenticated: boolean) {
    await userService.create({
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
    });
    await userService.create({
      name: 'User 2',
      email: 'user2@email.com',
      password: 'Xyz789*',
    });

    if (authenticated) {
      const authRet = await authService.login({
        email: 'user1@email.com',
        password: 'Abc12*',
      });
      return {
        refreshToken: authRet.data.payload.token,
        token: authRet.data.payload.refreshToken,
      };
    }
  }

  afterEach(async () => {
    await app.close();
    await moduleFixture.close();
  });

  describe('/ (GET)', () => {
    it('should succed when authorized', async () => {
      const { token } = await authenticationScenario(true);
      return request(app.getHttpServer())
        .get('/')
        .set('Authorization', 'bearer ' + token)
        .expect(200)
        .expect('Hello World!');
    });
    it('should fail when unauthorized', async () => {
      return request(app.getHttpServer()).get('/').expect(401);
    });
  });
});
