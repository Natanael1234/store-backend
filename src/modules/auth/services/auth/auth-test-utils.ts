import { JwtService } from '@nestjs/jwt';
import { RegisterResponseDto } from '../../dtos/responses/register.response.dto';
import { UserService } from '../../../user/services/user/user.service';
import { RefreshTokenRepository } from '../../repositories/refresh-token.repository';
import { Repository } from 'typeorm';
import { UserEntity } from '../../../user/models/user/user.entity';
import { AuthService } from './auth.service';
import { RefreshResponseDto } from '../../dtos/responses/refresh.response.dto';
import { LoginResponseDto } from '../../dtos/responses/login.response.dto';
import { LogoutResponseDto } from '../../dtos/responses/logout.response.dto';

export function testDecodedAccessToken(decodedAccessToken, userId) {
  expect(decodedAccessToken).toBeDefined();
  expect(decodedAccessToken['sub']).toEqual(`${userId}`);
  expect(decodedAccessToken['exp']).toBeDefined();
  expect(decodedAccessToken['iat']).toBeDefined();
  // TODO: validate times
}

export function testeDecodedRefreshToken(decodedRefreshToken, userId) {
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
  userId,
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
  expect(user.hash).toBeUndefined();
  expect(user.created).toBeDefined();
  expect(user.updated).toBeDefined();
  expect(user.deletedAt).toBeNull();
}

export function testAuthResponse(
  jwtService: JwtService,
  response,
  expectedUserData: { id: number; name: string; email: string },
) {
  expect(response).toBeDefined();
  expect(response.status).toEqual('success');
  expect(response.data).toBeDefined();
  testDecodedTokenUser(response.data.user, expectedUserData);
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

export const registerData = [
  {
    name: 'User 1',
    password: '123',
    email: 'user1@email.com',
    acceptTerms: true,
  },
  {
    name: 'User 2',
    password: '1234',
    email: 'user2@email.com',
    acceptTerms: true,
  },
  {
    name: 'User 3',
    password: '12345',
    email: 'user3@email.com',
    acceptTerms: true,
  },
];

export async function testRegister(
  userService: UserService,
  userRepo: Repository<UserEntity>,
  refreshTokenRepo: RefreshTokenRepository,
  jwtService: JwtService,
  registerCallback: (data: any) => Promise<RegisterResponseDto>,
) {
  const response1 = await registerCallback(registerData[0]);
  const response2 = await registerCallback(registerData[1]);

  await userService.create({
    name: 'Another user',
    email: 'anotheruser@email.com',
    password: 'abc',
  });
  const response3 = await registerCallback(registerData[2]);

  const refreshTokens = await refreshTokenRepo.find();
  const users = await userRepo.find();

  expect(refreshTokens).toHaveLength(3);
  expect(users).toHaveLength(4);

  testAuthResponse(jwtService, response1, {
    id: 1,
    name: registerData[0].name,
    email: 'user1@email.com',
  });
  testAuthResponse(jwtService, response2, {
    id: 2,
    name: registerData[1].name,
    email: 'user2@email.com',
  });
  testAuthResponse(jwtService, response3, {
    id: 4,
    name: registerData[2].name,
    email: 'user3@email.com',
  });

  testDistinctTokens(response1.data.payload, response2.data.payload);
  testDistinctTokens(response1.data.payload, response3.data.payload);
  testDistinctTokens(response2.data.payload, response3.data.payload);
}

export async function testLogin(
  userService: UserService,
  authService: AuthService,
  jwtService: JwtService,
  loginCallback: (data: any) => Promise<LoginResponseDto>,
) {
  await authService.register(registerData[0]);
  await authService.register(registerData[1]);
  const createUserData = {
    name: 'Another user',
    email: 'anotheruser@email.com',
    password: 'abc',
    acceptTerms: true,
  };
  await userService.create(createUserData);
  await authService.register(registerData[2]);

  const loginRet1 = await loginCallback({
    email: registerData[1].email,
    password: registerData[1].password,
  });

  const loginRet2 = await loginCallback({
    email: createUserData.email,
    password: createUserData.password,
  });

  // prevents tokens for the same user to be equal due to be generated at the same time
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const loginRet3 = await loginCallback({
    email: createUserData.email,
    password: createUserData.password,
  });

  testAuthResponse(jwtService, loginRet1, {
    id: 2,
    name: registerData[1].name,
    email: registerData[1].email,
  });

  testAuthResponse(jwtService, loginRet2, {
    id: 3,
    name: createUserData.name,
    email: createUserData.email,
  });

  testAuthResponse(jwtService, loginRet3, {
    id: 3,
    name: createUserData.name,
    email: createUserData.email,
  });

  testDistinctTokens(loginRet1.data.payload, loginRet2.data.payload);
  testDistinctTokens(loginRet1.data.payload, loginRet3.data.payload);
  testDistinctTokens(loginRet2.data.payload, loginRet3.data.payload);
}

export async function testRefresh(
  authService: AuthService,
  jwtService: JwtService,
  refreshCallback: (data: any) => Promise<RefreshResponseDto>,
) {
  const registerResponses = [
    await authService.register(registerData[0]),
    await authService.register(registerData[1]),
    await authService.register(registerData[2]),
  ];

  const refreshResponses = [
    await refreshCallback(registerResponses[0].data.payload.refreshToken),
    await refreshCallback(registerResponses[1].data.payload.refreshToken),
    await refreshCallback(registerResponses[1].data.payload.refreshToken),
  ];

  const decodedAccessTokens = [
    await jwtService.decode(refreshResponses[0].data.payload.token),
    await jwtService.decode(refreshResponses[1].data.payload.token),
    await jwtService.decode(refreshResponses[2].data.payload.token),
  ];

  testDecodedAccessToken(decodedAccessTokens[0], 1);
  testDecodedAccessToken(decodedAccessTokens[1], 2);
  testDecodedAccessToken(decodedAccessTokens[2], 2);
}

export async function testLogout(
  authService: AuthService,
  refreshTokenRepo: RefreshTokenRepository,
  logoutCallback: (data: any) => Promise<LogoutResponseDto>,
) {
  const registered = [
    await authService.register(registerData[0]),
    await authService.register(registerData[1]),
    await authService.register(registerData[2]),
  ];

  const logoutsResults = [
    await logoutCallback(registered[1].data.payload.refreshToken),
  ];

  const refreshTokens = await refreshTokenRepo.find();

  expect(logoutsResults[0]).toEqual({ status: 'success' });
  expect(refreshTokens).toHaveLength(3);
  expect(refreshTokens[0].revoked).toEqual(false);
  expect(refreshTokens[1].revoked).toEqual(true);
  expect(refreshTokens[2].revoked).toEqual(false);
}
