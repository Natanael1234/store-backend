const { envTestParameters } = require('./env-test-parameters');

process.env.SERVER_PORT = envTestParameters.SERVER_PORT;
process.env.SERVER_DEBUG_PORT = envTestParameters.SERVER_DEBUG_PORT;

process.env.DB_TYPE = envTestParameters.DB_TYPE;
process.env.DB_HOST = envTestParameters.DB_HOST;
process.env.DB_PORT = envTestParameters.DB_PORT;
process.env.DB_DATABASE_NAME = envTestParameters.DB_DATABASE_NAME;
process.env.DB_USERNAME = envTestParameters.DB_USERNAME;
process.env.DB_PASSWORD = envTestParameters.DB_PASSWORD;

process.env.REDIS_HOST = envTestParameters.REDIS_HOST;
process.env.EDIS_PORT = envTestParameters.EDIS_PORT;

process.env.CRYPTO_PASSWORD = envTestParameters.CRYPTO_PASSWORD;

process.env.ACCESS_TOKEN_SECRET = envTestParameters.ACCESS_TOKEN_SECRET;
process.env.ACCESS_TOKEN_EXPIRATION = envTestParameters.ACCESS_TOKEN_EXPIRATION;
process.env.REFRESH_TOKEN_SECRET = envTestParameters.REFRESH_TOKEN_SECRET;
process.env.REFRESH_TOKEN_EXPIRATION =
  envTestParameters.REFRESH_TOKEN_EXPIRATION;

process.env.MINIO_ENDPOINT = envTestParameters.MINIO_ENDPOINT;
process.env.MINIO_PORT = envTestParameters.MINIO_PORT;
process.env.MINIO_CONSOLE_PORT = envTestParameters.MINIO_CONSOLE_PORT;
process.env.MINIO_ACCESS_KEY = envTestParameters.MINIO_ACCESS_KEY;
process.env.MINIO_SECRET_KEY = envTestParameters.MINIO_SECRET_KEY;
process.env.MINIO_USER = envTestParameters.MINIO_USER;
process.env.MINIO_PASSWORD = envTestParameters.MINIO_PASSWORD;
process.env.MINIO_USE_SSL = envTestParameters.MINIO_USE_SSL;
process.env.MINIO_BUCKET_NAME = envTestParameters.MINIO_BUCKET_NAME;
