import { BadRequestException } from '@nestjs/common';

export class MinioCongifs {
  public static readonly ENDPOINT = process.env.MINIO_ENDPOINT;

  public static readonly PORT = +process.env.MINIO_PORT;

  public static readonly CONSOLE_PORT = +process.env.MINIO_CONSOLE_PORT;

  public static readonly USE_SSL = process.env.MINIO_USE_SSL == 'true';

  public static readonly ACCESS_KEY = process.env.MINIO_ACCESS_KEY;

  public static readonly SECRET_KEY = process.env.MINIO_SECRET_KEY;

  public static readonly BUCKET_NAME = process.env.MINIO_BUCKET_NAME;

  public static getPublicReadPolicy(bucketName, prefixes: string[]) {
    if (!bucketName) {
      throw new BadRequestException('Bucket not defined');
    }
    if (!prefixes?.length) {
      throw new BadRequestException('Prefixes not defined');
    }
    const resources = prefixes.map((prefix) => {
      return `arn:aws:s3:::${bucketName}/${prefix}`;
    });

    const policy = JSON.stringify(
      {
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'PublicRead',
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: resources,
          },
        ],
      },
      null,
      4,
    );
    return policy;
  }
}
