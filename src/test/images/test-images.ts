import * as fs from 'fs/promises';
import * as path from 'path';

export class TestImages {
  static getFilenames() {
    return [
      'caramelo.jpg',
      'cartoon-dog.png',
      'caramelo-2.jpg',
      'cartoon-dog-2.png',
      'cartoon-dog-3.png',
      'dog1.png',
      'dog2.png',
      'dog3.png',
      'dog4.png',
      'dog5.png',
      'dog6.png',
      'dog7.png',
      'dog8.png',
      'dog9.png',
      'dog10.png',
      'dog11.png',
      'dog12.png',
      'dog12.png',
      'dog13.png',
    ];
  }

  static getFilePaths() {
    const filePaths = TestImages.getFilenames().map((filename) => {
      return path.join(__dirname, filename).replace(/\\+/g, '/');
    });
    return filePaths;
  }

  static async createMockFile(filepath: string): Promise<Express.Multer.File> {
    const tokens = filepath.split('.');

    const extension = tokens.pop();

    const fieldname = 'myField';
    const originalname = 'example.' + extension;
    const encoding = '7bit';
    const mimetype = 'image/' + extension;
    const buffer = Buffer.from(await fs.readFile(filepath));
    const size = buffer.byteLength; // 1024;
    const filename =
      'some-filename.' + (extension == 'jpg' ? 'jpeg' : extension);
    const stream = null;
    const destination = '';
    const path = '';

    const mockFile: Express.Multer.File = {
      fieldname,
      originalname,
      encoding,
      mimetype,
      size,
      buffer,
      stream,
      destination,
      filename,
      path,
    };

    return mockFile;
  }

  static async buildFiles(quantity: number): Promise<Express.Multer.File[]> {
    const filePaths = TestImages.getFilePaths();
    if (!quantity || quantity < 0 || quantity > filePaths.length) {
      throw new Error('Invalid file quantity');
    }
    const files: Express.Multer.File[] = [];
    for (let i = 0; i < quantity; i++) {
      const path = filePaths[i];
      const file = await TestImages.createMockFile(path);
      files.push(file);
    }
    return files;
  }
}
