import { envTestParameters } from '../../../../.jest/env-test-parameters';
import { DatabaseConfigs } from './database.config';

describe('DatabaseConfig', () => {
  it('EncryptationConfigs should be defined', () => {
    expect(DatabaseConfigs).toBeDefined();
  });

  it('DB type should be defined', () => {
    expect(DatabaseConfigs.DB_TYPE).toEqual(envTestParameters.DB_TYPE);
  });

  it('DB host should be defined', () => {
    expect(DatabaseConfigs.DB_HOST).toEqual(envTestParameters.DB_HOST);
  });

  it('DB port should be defined', () => {
    expect(DatabaseConfigs.DB_PORT).toEqual(+envTestParameters.DB_PORT);
  });

  it('DB name should be defined', () => {
    expect(DatabaseConfigs.DB_DATABASE_NAME).toEqual(
      envTestParameters.DB_DATABASE_NAME,
    );
  });

  it('DB username should be defined', () => {
    expect(DatabaseConfigs.DB_USERNAME).toEqual(envTestParameters.DB_USERNAME);
  });

  it('DB password should be defined', () => {
    expect(DatabaseConfigs.DB_PASSWORD).toEqual(envTestParameters.DB_PASSWORD);
  });
});
