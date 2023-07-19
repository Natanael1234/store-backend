import { BadRequestException } from '@nestjs/common';
import { envTestParameters } from '../../../../../.jest/env-test-parameters';
import { MinioCongifs } from './minio.configs';

describe('MinioConfigs', () => {
  it('MinioCongifs should be defined', () => {
    expect(MinioCongifs).toBeDefined();
  });

  it('endpoint should be defined', () => {
    expect(MinioCongifs.ENDPOINT).toEqual(envTestParameters.MINIO_ENDPOINT);
  });

  it('port should be defined', () => {
    expect(MinioCongifs.PORT).toEqual(+envTestParameters.MINIO_PORT);
  });

  it('console port should be defined', () => {
    expect(MinioCongifs.CONSOLE_PORT).toEqual(
      +envTestParameters.MINIO_CONSOLE_PORT,
    );
  });

  it('use ssl should be defined', () => {
    expect(MinioCongifs.USE_SSL).toEqual(envTestParameters.MINIO_USE_SSL);
  });

  it('access key should be defined', () => {
    expect(MinioCongifs.ACCESS_KEY).toEqual(envTestParameters.MINIO_ACCESS_KEY);
  });

  it('secret key should be defined', () => {
    expect(MinioCongifs.SECRET_KEY).toEqual(envTestParameters.MINIO_SECRET_KEY);
  });

  it('bucket name should be defined', () => {
    expect(MinioCongifs.BUCKET_NAME).toEqual(
      envTestParameters.MINIO_BUCKET_NAME,
    );
  });

  it('publicPolicy method should be defined', () => {
    expect(MinioCongifs.getPublicReadPolicy).toBeDefined();
  });

  it('publicPolicy should return public policy string', () => {
    expect(
      MinioCongifs.getPublicReadPolicy('bucket_name', ['prefix_name']),
    ).toEqual(
      JSON.stringify(
        {
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicRead',
              Effect: 'Allow',
              Principal: '*',
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::bucket_name/prefix_name`],
            },
          ],
        },
        null,
        4,
      ),
    );
  });

  it('publicPolicy should fail if prefixes is not defined', () => {
    const fn = () => MinioCongifs.getPublicReadPolicy('bucket_name', null);
    expect(fn).toThrow('Prefixes not defined');
    expect(fn).toThrow(BadRequestException);
  });

  it('publicPolicy should fail if prefixes is empty', () => {
    const fn = () => MinioCongifs.getPublicReadPolicy('bucket_name', []);
    expect(fn).toThrow('Prefixes not defined');
    expect(fn).toThrow(BadRequestException);
  });
});
