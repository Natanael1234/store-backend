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

  MINIO_ENDPOINT: 'minio',
  MINIO_PORT: 9000,
  MINIO_CONSOLE_PORT: 9001,
  MINIO_ACCESS_KEY: 'gOsYYD5cAD8IKsjiQyhh',
  MINIO_SECRET_KEY: 'olzAn7Zf9TMGYCo14doOgbEaZxqjde2XoGBxALYP',
  MINIO_USER: 'user',
  MINIO_PASSWORD: 'password',
  MINIO_USE_SSL: false,
  MINIO_BUCKET_NAME: 'store-bucket',
};
