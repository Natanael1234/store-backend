import { JwtService } from '@nestjs/jwt';

export function testDecodedAccessToken(decodedAccessToken, userId: string) {
  expect(decodedAccessToken).toBeDefined();
  expect(decodedAccessToken['sub']).toEqual(`${userId}`);
  expect(decodedAccessToken['exp']).toBeDefined();
  expect(decodedAccessToken['iat']).toBeDefined();
  // TODO: validate times
}

export function testeDecodedRefreshToken(decodedRefreshToken, userId: string) {
  expect(decodedRefreshToken).toBeDefined();
  expect(decodedRefreshToken['sub']).toEqual(`${userId}`);
  expect(decodedRefreshToken['iat']).toBeDefined();
  expect(decodedRefreshToken['exp']).toBeDefined();
  expect(decodedRefreshToken['exp']).toBeGreaterThanOrEqual(
    decodedRefreshToken['iat'],
  );
  // TODO: validate times
}

export function testDecodedTokenPayload(
  jwtService: JwtService,
  payload,
  userId: string,
) {
  expect(payload).toBeDefined();
  expect(payload.type).toEqual('bearer');
  expect(payload.token).toBeDefined();
  expect(payload.refreshToken).toBeDefined();
  const decodedAccessToken = jwtService.decode(payload.token);
  const decodedRefreshToken = jwtService.decode(payload.refreshToken);
  testDecodedAccessToken(decodedAccessToken, userId);
  testeDecodedRefreshToken(decodedRefreshToken, userId);
}

export function testDecodedTokenUser(user, expectedUserData) {
  expect(user).toBeDefined();
  expect(user.id).toEqual(expectedUserData.id);
  expect(user.email).toEqual(expectedUserData.email);
  expect(user.name).toEqual(expectedUserData.name);
  expect(user.active).toEqual(expectedUserData.active);
  expect(user.hash).toBeUndefined();
  expect(user.created).toBeDefined();
  expect(user.updated).toBeDefined();
  expect(user.deletedAt).toBeNull();
}

export function testAuthenticationResponse(
  jwtService: JwtService,
  response: {
    data: { user; payload };
    status: 'success';
  },
  expectedUserData: {
    id: string;
    name: string;
    email: string;
    active: boolean;
  },
) {
  expect(response).toBeDefined();
  expect(response.status).toEqual('success');
  expect(response.data).toBeDefined();
  testDecodedTokenUser(response.data.user, expectedUserData);
  // TODO: test roles
  testDecodedTokenPayload(
    jwtService,
    response.data.payload,
    response.data.user.id,
  );
}

export function testDistinctTokens(payload1, payload2) {
  expect(payload1.token).not.toEqual(payload1.refreshToken);
  expect(payload2.token).not.toEqual(payload2.refreshToken);

  expect(payload1.token).not.toEqual(payload2.token);
  expect(payload1.token).not.toEqual(payload2.refreshToken);
  expect(payload1.refreshToken).not.toEqual(payload2.token);
  expect(payload1.refreshToken).not.toEqual(payload2.refreshToken);
}
