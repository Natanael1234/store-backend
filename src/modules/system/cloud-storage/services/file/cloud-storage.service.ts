import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as minio from 'minio';
import * as path from 'path';
import { MinioCongifs } from '../../configs/minio/minio.configs';
import { FileMessage } from './file-messages/file-messages.enum';

export type CloudStorageConfigs = {
  endPoint: string;
  bucketName: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
};

@Injectable()
export class CloudStorageService {
  private readonly client: minio.Client;

  constructor(private readonly configs: CloudStorageConfigs) {
    this.client = new minio.Client(configs);
  }

  async save(
    files: Express.Multer.File[],
    directory?: string,
  ): Promise<boolean> {
    if (!files) {
      throw new UnprocessableEntityException(FileMessage.FILES_NOT_DEFINED);
    }
    for (const file of files) {
      await this.saveSingleFile(file, directory);
    }
    return true;
  }

  private async saveSingleFile(
    file: Express.Multer.File,
    directory?: string,
  ): Promise<boolean> {
    if (!file) {
      throw new UnprocessableEntityException(FileMessage.FILE_NOT_DEFINED);
    }
    if (!Buffer.isBuffer(file.buffer)) {
      throw new UnprocessableEntityException(FileMessage.INVALID_FILE);
    }
    if (directory == null) {
      throw new BadRequestException(FileMessage.DIRECTORY_NOT_DEFINED);
    }
    const filename = this.getUniqueFilename(file);
    const objectName = path.join(directory, filename);
    const buffer = Buffer.from(file.buffer);
    await this.manageBucket();
    const info: minio.UploadedObjectInfo = await this.client.putObject(
      this.configs.bucketName,
      objectName,
      buffer,
    );
    return true;
  }

  private async manageBucket() {
    if (!(await this.client.bucketExists(this.configs.bucketName))) {
      await this.client.makeBucket(this.configs.bucketName);
      const policy = MinioCongifs.getPublicReadPolicy(this.configs.bucketName, [
        'images/products',
        'images/products/*',
      ]);
      await this.client.setBucketPolicy(this.configs.bucketName, policy);
    }
  }

  async list(directory: string): Promise<string[]> {
    if (!(await this.client.bucketExists(this.configs.bucketName))) {
      await this.client.makeBucket(this.configs.bucketName);
    }
    if (directory == null) {
      throw new BadRequestException(FileMessage.DIRECTORY_NOT_DEFINED);
    }
    if (typeof directory != 'string') {
      throw new BadRequestException(FileMessage.INVALID_DIRECTORY_NAME);
    }
    return await new Promise((resolve, reject) => {
      const objects: string[] = [];

      const bucketName = this.configs.bucketName;
      const objectsStream = this.client.listObjectsV2(
        bucketName,
        directory,
        false,
      );
      objectsStream.on('data', (obj) => objects.push(obj.name || obj.prefix));
      objectsStream.on('error', (err) => reject(err));
      objectsStream.on('end', () => {
        resolve(objects);
      });
    });
  }

  async get(objectName: string): Promise<Buffer> {
    if (objectName == null) {
      throw new BadRequestException(FileMessage.NAME_NOT_DEFINED);
    }
    if (typeof objectName != 'string') {
      throw new BadRequestException(FileMessage.INVALID_FILE_NAME);
    }
    try {
      const objectData = await this.client.getObject(
        this.configs.bucketName,
        objectName,
      );
      const chunks: Buffer[] = [];
      return new Promise<Buffer>((resolve, reject) => {
        objectData.on('data', (chunk) => chunks.push(chunk));
        objectData.on('end', () => resolve(Buffer.concat(chunks)));
        objectData.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      if (error.code == 'NoSuchKey') {
        throw new NotFoundException(FileMessage.FILE_NOT_FOUND);
      }
      throw new UnprocessableEntityException(
        // `Failed to get object from MinIO: ${error.message}`,
        `${error.message}`,
      );
    }
  }

  async delete(objects: string[]) {
    if (objects == null) {
      throw new BadRequestException(FileMessage.FILES_NOT_DEFINED);
    }
    if (!Array.isArray(objects)) {
      throw new BadRequestException(FileMessage.INVALID_FILE_NAMES);
    }
    if (objects.findIndex((object) => typeof object !== 'string') != -1) {
      throw new BadRequestException(FileMessage.INVALID_FILE_NAME);
    }

    await this.client.removeObjects(this.configs.bucketName, objects);
    return true;
  }

  private getUniqueFilename(file: Express.Multer.File): string {
    if (!file) {
      throw new UnprocessableEntityException(FileMessage.FILE_NOT_DEFINED);
    }
    if (!file.originalname) {
      throw new UnprocessableEntityException(FileMessage.NAME_NOT_DEFINED);
    }
    if (typeof file.originalname != 'string') {
      throw new UnprocessableEntityException(FileMessage.INVALID_FILE_NAME);
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const tokens = file.originalname.split('.');
    let ext;
    if (!tokens || tokens.length < 2) {
      ext == '';
    } else {
      ext = '.' + tokens[tokens.length - 1];
    }
    const filename = `${uniqueSuffix}${ext}`;
    return filename;
  }
}
