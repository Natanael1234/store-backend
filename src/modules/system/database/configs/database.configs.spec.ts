import { envTestParameters } from '../../../../.jest/env-test-parameters';
import { DatabaseConfigs } from './database.configs';

describe('DatabaseConfigs', () => {
  it('DB should be defined', () => {
    expect(DatabaseConfigs).toBeDefined();
  });

  it('DB_TYPE should be defined', () => {
    expect(DatabaseConfigs.DB_TYPE).toEqual(envTestParameters.DB_TYPE);
  });

  it('DB_HOST should be defined', () => {
    expect(DatabaseConfigs.DB_HOST).toEqual(envTestParameters.DB_HOST);
  });

  it('DB_PORT should be defined', () => {
    expect(DatabaseConfigs.DB_PORT).toEqual(+envTestParameters.DB_PORT);
  });

  it('DB_DATABASE_NAME should be defined', () => {
    expect(DatabaseConfigs.DB_DATABASE_NAME).toEqual(
      envTestParameters.DB_DATABASE_NAME,
    );
  });

  it('DB_USERNAME should be defined', () => {
    expect(DatabaseConfigs.DB_USERNAME).toEqual(envTestParameters.DB_USERNAME);
  });

  it('DB_PASSWORD should be defined', () => {
    expect(DatabaseConfigs.DB_PASSWORD).toEqual(envTestParameters.DB_PASSWORD);
  });
});
