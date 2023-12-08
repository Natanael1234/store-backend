import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as minio from 'minio';
import { MinioCongifs } from '../../configs/minio/minio.configs';
import { StorageMessage } from '../../messages/storage/storage.messages';

const Messages = new StorageMessage();

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

  /**
   * Creates the bucket if does not exists.
   */
  private async manageBucket() {
    if (!(await this.client.bucketExists(this.configs.bucketName))) {
      await this.client.makeBucket(this.configs.bucketName);
      const policy = MinioCongifs.getPublicReadPolicy(this.configs.bucketName, [
        // 'images/products',
        // 'images/products/*',
        '/public',
        '/public/*',
      ]);
      await this.client.setBucketPolicy(this.configs.bucketName, policy);
    }
  }

  /**
   * Checks if object name has valid type and format.
   * @returns true if valid. False otherwise.
   */
  private isValidObjectName(filename: string) {
    if (typeof filename != 'string') {
      return false;
    }
    const regexp =
      /^(\/(private|public|deleted)\/)((([\w]+-)*[\w]+)\/)*((([\w]+-)*[\w]))+(\.[\w]+)*$/gi;
    if (regexp.test(filename)) {
      return true;
    }
    return false;
  }

  /**
   * Checks if object name is valid.
   * @throws UnprocessableEntityException if objectName ins invalid.
   */
  private validateObjectName(objectName: string) {
    if (objectName == null) {
      throw new UnprocessableEntityException(Messages.OBJECT_NAME_REQUIRED);
    }
    if (!this.isValidObjectName(objectName)) {
      throw new UnprocessableEntityException(Messages.OBJECT_NAME_INVALID);
    }
  }

  private validateSourceObjectName(objectName: string) {
    if (objectName == null) {
      throw new UnprocessableEntityException(
        Messages.SOURCE_OBJECT_NAME_REQUIRED,
      ); // TODO: mover para enumeração
    }
    if (!this.isValidObjectName(objectName)) {
      throw new UnprocessableEntityException(
        Messages.SOURCE_OBJECT_NAME_INVALID,
      );
    }
  }

  /**
   * Saves a file at cloud storage.
   *
   * @param file file data.
   * @param objectName file path. Ex.: "directory/subdirectory/filename.ext".
   * @throws UnprocessableEntityException when file invalid.
   * @throws UnprocessableEntityException when objectName is invalidt.
   */
  async save(file: Express.Multer.File, objectName: string): Promise<void> {
    if (file == null) {
      throw new UnprocessableEntityException(Messages.OBJECT_DATA_REQUIRED);
    }
    if (!Buffer.isBuffer(file.buffer)) {
      throw new UnprocessableEntityException(Messages.OBJECT_DATA_INVALID);
    }
    this.validateObjectName(objectName);
    const buffer = Buffer.from(file.buffer);
    await this.manageBucket();
    const info: minio.UploadedObjectInfo = await this.client.putObject(
      this.configs.bucketName,
      objectName,
      buffer,
    );
  }

  /**
   * List objects of a directory.
   * @param directory directory name array.
   * @returns list of filenames and directories.
   */
  async list(directory: string): Promise<string[]> {
    if (!(await this.client.bucketExists(this.configs.bucketName))) {
      await this.client.makeBucket(this.configs.bucketName);
    }
    if (directory == null) {
      throw new UnprocessableEntityException(Messages.DIRECTORY_REQUIRED);
    }
    if (typeof directory != 'string') {
      throw new UnprocessableEntityException(Messages.DIRECTORY_INVALID);
    }
    return await new Promise((resolve, reject) => {
      const objects: string[] = [];
      if (directory && !directory.endsWith('/')) {
        directory += '/';
      }
      const bucketName = this.configs.bucketName;
      const objectsStream = this.client.listObjectsV2(
        bucketName,
        directory,
        false,
      );
      objectsStream.on('data', (obj) => {
        objects.push(obj.name || obj.prefix);
      });
      objectsStream.on('error', (err) => {
        reject(err);
      });
      objectsStream.on('end', () => {
        resolve(objects);
      });
    });
  }

  /**
   * Retrieve object data.
   * @param objectName object name.
   * @returns object buffer.
   * @throws UnprocessableEntityException when objectName invalid.
   */
  async get(objectName: string): Promise<Buffer> {
    this.validateObjectName(objectName);
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
        throw new NotFoundException(Messages.OBJECT_NOT_FOUND);
      }
      throw new UnprocessableEntityException(
        // `Failed to get object from MinIO: ${error.message}`,
        `${error.message}`,
      );
    }
  }

  /**
   * Moves (rename) a object.
   * Overwrites existent objects.
   * @param objectName name of the object that will be saved.
   * @param sourceObject existing object from which will be copied.
   * @throws UnprocessableEntityException objectName is invalid.
   * @throws UnprocessableEntityException sourceObject is invalid.
   * @throws UnprocessableEntityException sourceObject is not found.
   */
  public async move(objectName: string, sourceObject: string) {
    this.validateObjectName(objectName);
    this.validateSourceObjectName(sourceObject);
    await this.copy(objectName, sourceObject);
    await this.delete([sourceObject]);
  }

  /**
   * Copies a opbject.
   * Overwrites existent objects.
   * @param objectName object name.
   * @param sourceObject source object name.
   * @param conditions
   * @throws UnprocessableEntityException if objectName is invalid.
   * @throws UnprocessableEntityException if sourceObject is invalid.
   */
  async copy(
    objectName: string,
    sourceObject: string,
    conditions?: minio.CopyConditions, // TODO: verificar se é necessário.
  ) {
    this.validateObjectName(objectName);
    this.validateSourceObjectName(sourceObject);
    await this.manageBucket();
    try {
      await this.client.copyObject(
        this.configs.bucketName,
        objectName,
        sourceObject,
        conditions,
      );
    } catch (error) {
      if (error.code == 'NoSuchKey') {
        throw new NotFoundException(Messages.OBJECT_NOT_FOUND);
      }
      throw new UnprocessableEntityException(
        // `Failed to get object from MinIO: ${error.message}`, // TODO: verificar se esta mensagem está correta
        `${error.message}`,
      );
    }
  }

  /**
   * Delete objects.
   * @param objectNames names of the objects to be deleted.
   * @throws UnprocessableEntityException when a object is not found.
   */
  async delete(objectNames: string[]) {
    // fails if object list is not defined
    if (objectNames == null) {
      throw new UnprocessableEntityException(
        Messages.OBJECT_NAME_LIST_REQUIRED,
      );
    }

    // fails if object list is not array
    if (!Array.isArray(objectNames)) {
      throw new UnprocessableEntityException(Messages.OBJECT_NAME_LIST_INVALID);
    }

    // fail if object list contains invalid filename
    for (const objectName of objectNames) {
      if (objectName == null) {
        throw new UnprocessableEntityException(Messages.OBJECT_NAME_REQUIRED);
      } else if (typeof objectName != 'string') {
        throw new UnprocessableEntityException(Messages.OBJECT_NAME_INVALID);
      }
    }

    // remove objects from storage
    try {
      await this.client.removeObjects(this.configs.bucketName, objectNames);
    } catch (error) {
      if (error.code == 'NoSuchKey') {
        throw new NotFoundException(Messages.OBJECT_NOT_FOUND);
      }
      throw new UnprocessableEntityException(
        // `Failed to get object from MinIO: ${error.message}`, // TODO: verificar se esta mensagem está correta
        `${error.message}`,
      );
    }
  }

  /**
   * TODO: test.
   * Generate unique object in the format timestamp-random.ext where ext is the file extension, when file has an extension.
   * @param objectName original object name.
   * @returns unique filename. Ex.: 3444565-3455665.jpg
   * @throws UnprocessableEntityException when name is not defined, is empty or has wrong type.
   */
  public generateUniqueObjectname(objectName: string): string {
    if (!objectName) {
      throw new UnprocessableEntityException(Messages.OBJECT_NAME_REQUIRED);
    }
    if (typeof objectName != 'string') {
      throw new UnprocessableEntityException(Messages.OBJECT_NAME_INVALID);
    }
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const tokens = objectName.split('.');
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
