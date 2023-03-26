const env = require('dotenv').config().parsed;
import { envTestParameters } from './env-test-parameters';

/** TODO: verificar se os valores vão mudar conforme o ambiente? */
describe('.env file', () => {
  it('env variables should be defined', () => {
    expect(env).toBeDefined();
  });

  describe('server', () => {
    it('should contain server port', () => {
      expect(env.SERVER_PORT).toEqual(envTestParameters.SERVER_PORT);
    });

    it('should contain server debug port', () => {
      expect(env.SERVER_DEBUG_PORT).toEqual(
        envTestParameters.SERVER_DEBUG_PORT,
      );
    });
  });

  describe('db', () => {
    it('should contain database type', () => {
      expect(env.DB_TYPE).toEqual(envTestParameters.DB_TYPE);
    });

    it('should contain database host', () => {
      expect(env.DB_HOST).toEqual(envTestParameters.DB_HOST);
    });

    it('should contain database debug port', () => {
      expect(env.DB_PORT).toEqual(envTestParameters.DB_PORT);
    });

    it('should contain database name', () => {
      expect(env.DB_DATABASE_NAME).toEqual(envTestParameters.DB_DATABASE_NAME);
    });

    it('should contain database user name', () => {
      expect(env.DB_USERNAME).toEqual(envTestParameters.DB_USERNAME);
    });

    it('should contain database password', () => {
      expect(env.DB_PASSWORD).toEqual(envTestParameters.DB_PASSWORD);
    });
  });

  describe('redis', () => {
    it('should contain redis host', () => {
      expect(env.REDIS_HOST).toEqual(envTestParameters.REDIS_HOST);
    });

    it('should contain redis host', () => {
      expect(env.REDIS_PORT).toEqual(envTestParameters.REDIS_PORT);
    });
  });

  describe('crypto', () => {
    it('should contain crypto password', () => {
      expect(env.CRYPTO_PASSWORD).toEqual(envTestParameters.CRYPTO_PASSWORD);
    });
  });

  describe('jwt', () => {
    it('should contain access token secret', () => {
      expect(env.ACCESS_TOKEN_SECRET).toEqual(
        envTestParameters.ACCESS_TOKEN_SECRET,
      );
    });

    it('should contain access token expiration', () => {
      expect(env.ACCESS_TOKEN_EXPIRATION).toEqual(
        envTestParameters.ACCESS_TOKEN_EXPIRATION,
      );
    });

    it('should contain refresh token secret', () => {
      expect(env.REFRESH_TOKEN_SECRET).toEqual(
        envTestParameters.REFRESH_TOKEN_SECRET,
      );
    });

    it('should contain refresh token expiration', () => {
      expect(env.REFRESH_TOKEN_EXPIRATION).toEqual(
        envTestParameters.REFRESH_TOKEN_EXPIRATION,
      );
    });
  });
});
