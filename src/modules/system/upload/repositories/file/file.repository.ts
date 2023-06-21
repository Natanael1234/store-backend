import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { access, mkdir, writeFile } from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FileRepository {
  /**
   *
   * @param files
   * @param directory ex.: images/products
   * @returns
   */
  async saveFiles(files: Array<Express.Multer.File>, directory?: string) {
    return files.map((file) => this.saveFile(file, directory));
  }

  /**
   *
   * @param file
   * @param directory ex.: images/products
   * @returns
   */
  async saveFile(
    file: Express.Multer.File,
    directory?: string,
    filename?: string,
  ) {
    if (!filename) {
      filename = this.getUniqueFilename(file);
    } else {
      filename = file.originalname;
    }
    const destinationPath = this.getFilePath(filename, directory);
    directory = path.dirname(destinationPath);

    await this.createDirectoryIfNotExists(directory);
    return writeFile(destinationPath, file.buffer);
  }

  private getUniqueFilename(file: Express.Multer.File): string {
    if (!file || !file.originalname) {
      throw new UnprocessableEntityException('File not defined');
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

  private getFilePath(filename: string, directory?: string): string {
    const basePath = this.fileDirectoryBasePath;
    if (directory) {
      if (directory && !directory.endsWith('/')) {
        directory += '/';
      }
    } else {
      directory = '';
    }
    return basePath + directory + filename;
  }

  private get fileDirectoryBasePath() {
    return process.cwd() + '/files/';
  }

  private async createDirectoryIfNotExists(dir: string) {
    if (!(await this.directoryExists(dir))) {
      mkdir(dir, { recursive: true });
    }
  }

  private async directoryExists(path: string) {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }
}
