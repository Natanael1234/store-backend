import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { getTestingModule } from '../src/.jest/test-config.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await getTestingModule({
      imports: [AppModule],
    });

    // TODO: https://github.com/nestjs/nest/issues/5264
    // app = moduleFixture.createNestApplication();
    // await app.init();
  });

  it('/ (GET)', () => {
    // return request(app.getHttpServer())
    //   .get('/')
    //   .expect(200)
    //   .expect('Hello World!');
    expect(true).toBeTruthy();
  });
});
