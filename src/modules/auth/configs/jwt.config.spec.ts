import { envTestParameters } from '../../../.jest/env-test-parameters';
import { JWTConfigs } from './jwt.config';

describe('JWTConfigs', () => {
  it('JWTConfigs should be defined', () => {
    expect(JWTConfigs).toBeDefined();
  });

  it('access token secret should be defined', () => {
    expect(JWTConfigs.ACCESS_TOKEN_SECRET).toEqual(
      envTestParameters.ACCESS_TOKEN_SECRET,
    );
  });

  it('access token expiration should be defined', () => {
    expect(JWTConfigs.ACCESS_TOKEN_EXPIRATION).toEqual(
      envTestParameters.ACCESS_TOKEN_EXPIRATION,
    );
  });

  it('refresh token secret should be defined', () => {
    expect(JWTConfigs.REFRESH_TOKEN_SECRET).toEqual(
      envTestParameters.REFRESH_TOKEN_SECRET,
    );
  });

  it('refresh token expiration should be defined', () => {
    expect(JWTConfigs.REFRESH_TOKEN_EXPIRATION).toEqual(
      envTestParameters.REFRESH_TOKEN_EXPIRATION,
    );
  });
});
