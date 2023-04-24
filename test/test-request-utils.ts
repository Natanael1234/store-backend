import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export type TestRequestFunction = (
  endpoint: string,
  params: any,
  expectedStatus: number,
  accessToken?: string,
) => Promise<any>;

export function getHTTPGetMethod(app: INestApplication) {
  return async function httpGet(
    endpoint: string,
    params: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let test = request(app.getHttpServer()).get(endpoint);
    if (accessToken) {
      test = test.set('Authorization', 'bearer ' + accessToken);
    }
    const result = await test.query(params || {});
    expect(result.statusCode).toEqual(expectedStatus);
    return result.body;
  };
}

export function getHTTPPostMethod(app: INestApplication) {
  return async function httpPost(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let test = request(app.getHttpServer()).post(endpoint);
    if (accessToken) {
      test = test.set('Authorization', 'bearer ' + accessToken);
    }
    const result = await test.send(body);
    expect(result.statusCode).toEqual(expectedStatus);
    return result.body;
  };
}

export function getHTTPPatchMethod(app: INestApplication) {
  return async function httpPatch(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let test = request(app.getHttpServer()).patch(endpoint);
    if (accessToken) {
      test = test.set('Authorization', 'bearer ' + accessToken);
    }
    const result = await test.send(body);
    expect(result.statusCode).toEqual(expectedStatus);
    return result.body;
  };
}
export function getHTTPDeleteMethod(app: INestApplication) {
  return async function httpPatch(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let test = request(app.getHttpServer()).delete(endpoint);
    if (accessToken) {
      test = test.set('Authorization', 'bearer ' + accessToken);
    }
    const result = await test.send(body);
    expect(result.statusCode).toEqual(expectedStatus);
    return result.body;
  };
}
