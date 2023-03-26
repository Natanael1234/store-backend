export const envTestParameters = {
  SERVER_PORT: '3000',
  SERVER_DEBUG_PORT: '9229',

  DB_TYPE: 'postgres',
  DB_HOST: 'postgres',
  DB_PORT: '5432',
  DB_DATABASE_NAME: 'postgres',
  DB_USERNAME: 'user',
  DB_PASSWORD: 'password',

  REDIS_HOST: 'redis',
  REDIS_PORT: '6379',

  CRYPTO_PASSWORD: 'Password used to generate key',

  ACCESS_TOKEN_SECRET: 'Access Token Secret',
  ACCESS_TOKEN_EXPIRATION: '24h',
  REFRESH_TOKEN_SECRET: 'Refresh Token Secret',
  REFRESH_TOKEN_EXPIRATION: '30d',
};
