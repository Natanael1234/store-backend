import { envTestParameters } from '../../../.jest/env-test-parameters';
import { JWTConfigs } from './jwt.configs';

describe('JWTConfigs', () => {
  it('JWTConfigs should be defined', () => {
    expect(JWTConfigs).toBeDefined();
  });

  it('ACCESS_TOKEN_SECRET should be defined', () => {
    expect(JWTConfigs.ACCESS_TOKEN_SECRET).toEqual(
      envTestParameters.ACCESS_TOKEN_SECRET,
    );
  });

  it('ACCESS_TOKEN_EXPIRATION should be defined', () => {
    expect(JWTConfigs.ACCESS_TOKEN_EXPIRATION).toEqual(
      envTestParameters.ACCESS_TOKEN_EXPIRATION,
    );
  });

  it('REFRESH_TOKEN_SECRET should be defined', () => {
    expect(JWTConfigs.REFRESH_TOKEN_SECRET).toEqual(
      envTestParameters.REFRESH_TOKEN_SECRET,
    );
  });

  it('REFRESH_TOKEN_EXPIRATION should be defined', () => {
    expect(JWTConfigs.REFRESH_TOKEN_EXPIRATION).toEqual(
      envTestParameters.REFRESH_TOKEN_EXPIRATION,
    );
  });
});
