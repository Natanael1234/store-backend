import { HttpStatus, INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as request from 'supertest';
import { Repository } from 'typeorm';
import { Role } from '../../src/modules/authentication/enums/role/role.enum';
import { AuthenticationService } from '../../src/modules/authentication/services/authentication/authentication.service';
import { EncryptionService } from '../../src/modules/system/encryption/services/encryption/encryption.service';
import { User } from '../../src/modules/user/models/user/user.entity';
import { testInsertUsers } from '../../src/test/user/test-user-utils';

/** Create three users (root, user and admin) and its authentication tokens. */
export async function testBuildAuthenticationScenario(
  moduleFixture: TestingModule,
) {
  let authenticationService: AuthenticationService =
    moduleFixture.get<AuthenticationService>(AuthenticationService);
  let userRepo: Repository<User> = moduleFixture.get<Repository<User>>(
    getRepositoryToken(User),
  );
  let encryptionService =
    moduleFixture.get<EncryptionService>(EncryptionService);

  const userData = [
    {
      name: 'User 1',
      email: 'user1@email.com',
      password: 'Abc12*',
      active: true,
      roles: [Role.ROOT],
    },
    {
      name: 'User 2',
      password: 'Xyz12*',
      email: 'user2@email.com',
      active: true,
      roles: [Role.ADMIN],
    },
    {
      name: 'User 3',
      email: 'user3@email.com',
      password: 'Cba12*',
      active: true,
      roles: [Role.USER],
    },
  ];
  const [user1, user2, user3] = await testInsertUsers(
    userRepo,
    encryptionService,
    userData,
  );
  const loginResponses = [
    await authenticationService.login(userData[0]),
    await authenticationService.login(userData[1]),
    await authenticationService.login(userData[2]),
  ];
  return {
    rootToken: await loginResponses[0].data.payload.token,
    adminToken: await loginResponses[1].data.payload.token,
    userToken: await loginResponses[2].data.payload.token,
  };
}

export async function testPost(
  app: INestApplication,
  path: string,
  data: any,
  token: string,
  expectedStatusCode: HttpStatus,
) {
  let response;
  if (token != null) {
    response = await request(app.getHttpServer())
      .post(path)
      .set('Authorization', 'bearer ' + token)
      .send(data);
  } else {
    response = await request(app.getHttpServer()).post(path).send(data);
  }
  if (expectedStatusCode) {
    expect(response.statusCode).toEqual(expectedStatusCode);
  }
  return response;
}

export async function testPostMin(
  app: INestApplication,
  path: string,
  data: any,
  token: string,
  expectedStatusCode: HttpStatus,
) {
  const response = await testPost(app, path, data, token, expectedStatusCode);
  return response.body;
}

export async function testPatch(
  app: INestApplication,
  path: string,
  data: any,
  token: string,
  expectedStatusCode: HttpStatus,
) {
  let response;
  if (token != null) {
    response = await request(app.getHttpServer())
      .patch(path)
      .set('Authorization', 'bearer ' + token)
      .send(data);
  } else {
    response = await request(app.getHttpServer()).patch(path).send(data);
  }
  if (expectedStatusCode) {
    expect(response.statusCode).toEqual(expectedStatusCode);
  }
  return response;
}

export async function testPatchMin(
  app: INestApplication,
  path: string,
  data: any,
  token: string,
  expectedStatusCode: HttpStatus,
) {
  const response = await testPatch(app, path, data, token, expectedStatusCode);
  return response.body;
}

export async function testUpload(
  app: INestApplication,
  path: string,
  fields: object,
  attachments: { field: string; buffer: Buffer; filepath: string }[],
  token: string,
  expectedStatusCode: HttpStatus,
) {
  const server = app.getHttpServer();
  let requestInstance = request(server).post(path);
  // .set('content-type', 'multipart/form-data');

  if (token != null) {
    requestInstance.set('Authorization', 'bearer ' + token);
  }
  for (const attachment of attachments) {
    requestInstance.attach('images', attachment.buffer, attachment.filepath);
  }
  for (const fieldName of Object.keys(fields)) {
    requestInstance.field(fieldName, fields[fieldName]);
  }

  let response = await requestInstance;

  if (expectedStatusCode) {
    expect(response.statusCode).toEqual(expectedStatusCode);
  }
  return response;
}

export async function testUploadMin(
  app: INestApplication,
  path: string,
  fields: object,
  attachments: { field: string; buffer: Buffer; filepath: string }[],
  token: string,
  expectedStatusCode: HttpStatus,
) {
  const response = await testUpload(
    app,
    path,
    fields,
    attachments,
    token,
    expectedStatusCode,
  );
  return response.body;
}

export async function testGet(
  app: INestApplication,
  path: string,
  params: any,
  token: string,
  expectedStatusCode: HttpStatus,
) {
  let response;
  if (token != null) {
    response = await request(app.getHttpServer())
      .get(path)
      .set('Authorization', 'bearer ' + token)
      .query(params || {});
  } else {
    response = await request(app.getHttpServer())
      .get(path)
      .query(params || {});
  }
  if (expectedStatusCode) {
    expect(response.statusCode).toEqual(expectedStatusCode);
  }
  return response;
}

export async function testGetMin(
  app: INestApplication,
  path: string,
  params: { query: string },
  token: string,
  expectedStatusCode: HttpStatus,
) {
  const response = await testGet(app, path, params, token, expectedStatusCode);
  return response.body;
}

export async function testDelete(
  app: INestApplication,
  path: string,
  params: any,
  token: string,
  expectedStatusCode: HttpStatus,
) {
  let response;
  if (token != null) {
    response = await request(app.getHttpServer())
      .delete(path)
      .set('Authorization', 'bearer ' + token)
      .query(params || {});
  } else {
    response = await request(app.getHttpServer())
      .delete(path)
      .query(params || {});
  }
  if (expectedStatusCode) {
    expect(response.statusCode).toEqual(expectedStatusCode);
  }
  return response;
}

export async function testDeleteMin(
  app: INestApplication,
  path: string,
  params: { query: string },
  token: string,
  expectedStatusCode: HttpStatus,
) {
  const response = await testDelete(
    app,
    path,
    params,
    token,
    expectedStatusCode,
  );
  return response.body;
}
