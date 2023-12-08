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
    let req = request(app.getHttpServer()).get(endpoint);
    if (accessToken) {
      req = req.set('Authorization', 'bearer ' + accessToken);
    }
    const response = await req.query(params || {});
    expect(response.statusCode).toEqual(expectedStatus);
    return response.body;
  };
}

export function getHTTPPostMethod(app: INestApplication) {
  return async function httpPost(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let req = request(app.getHttpServer()).post(endpoint);
    if (accessToken) {
      req = req.set('Authorization', 'bearer ' + accessToken);
    }
    const response = await req.send(body);
    expect(response.statusCode).toEqual(expectedStatus);
    return response.body;
  };
}

export function getHTTPPatchMethod(app: INestApplication) {
  return async function httpPatch(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let req = request(app.getHttpServer()).patch(endpoint);
    if (accessToken) {
      req = req.set('Authorization', 'bearer ' + accessToken);
    }
    const response = await req.send(body);
    expect(response.statusCode).toEqual(expectedStatus);
    return response.body;
  };
}
export function getHTTPDeleteMethod(app: INestApplication) {
  return async function httpPatch(
    endpoint: string,
    body: any,
    expectedStatus: number,
    accessToken?: string,
  ) {
    let req = request(app.getHttpServer()).delete(endpoint);
    if (accessToken) {
      req = req.set('Authorization', 'bearer ' + accessToken);
    }
    const response = await req.send(body);
    expect(response.statusCode).toEqual(expectedStatus);
    return response.body;
  };
}
