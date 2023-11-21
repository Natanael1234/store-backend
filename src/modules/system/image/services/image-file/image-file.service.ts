import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import * as sharp from 'sharp';
import { allowedImageFileTypes } from '../../../cloud-storage/services/cloud-storage/image-upload-utils';
import { FileMessage } from '../../../messages/file/file.messages.enum';

@Injectable()
export class ImageService {
  /**
   * Scales down and changes the format to jpeg.
   * @param file jpeg thumbnail.
   * @returns resized jpeg file.
   */
  async generateThumbnail(
    file: Express.Multer.File,
  ): Promise<Express.Multer.File> {
    if (!file) {
      throw new UnprocessableEntityException(FileMessage.FILE_NOT_DEFINED);
    }
    if (!file.originalname) {
      throw new UnprocessableEntityException(FileMessage.FILE_NAME_NOT_DEFINED);
    }
    if (typeof file.originalname != 'string') {
      throw new UnprocessableEntityException(FileMessage.INVALID_FILE_NAME);
    }
    if (!file.buffer) {
      throw new UnprocessableEntityException(FileMessage.INVALID_FILE);
    }

    try {
      const resizedBuffer = await sharp(file.buffer)
        .resize({ width: 150 }) // Set the desired width and height
        .toFormat('jpeg')
        .toBuffer();

      const originalname = file.originalname.split('.');
      const newOriginalname =
        originalname.slice(0, originalname.length - 1).join('.') + '.jpeg';

      const thumbnail: Express.Multer.File = {
        fieldname: file.fieldname,
        originalname: newOriginalname,
        encoding: file.encoding,
        mimetype: 'image/jpeg',
        size: Buffer.byteLength(resizedBuffer),
        buffer: resizedBuffer,
        destination: file.destination,
        filename: file.filename,
        path: file.path,
        stream: null,
      };
      return thumbnail;
    } catch (error) {
      throw new UnprocessableEntityException(FileMessage.INVALID_FILE);
    }
  }

  // TODO: test
  /**
   * Changes the extension of a filename.
   * @param filename file name.
   * @param newExtension new extension.
   * @returns file name with new extension.
   */
  changeFilenameExtension(filename: string, newExtension: string): string {
    if (!filename) {
      throw new UnprocessableEntityException(FileMessage.FILE_NAME_NOT_DEFINED);
    }
    if (!allowedImageFileTypes.includes('.' + newExtension)) {
      throw new UnprocessableEntityException(
        FileMessage.INVALID_FILE_EXTENSION,
      );
    }
    const filenameTokens = filename.split('.');
    if (filenameTokens.length >= 2) {
      filename =
        filenameTokens.slice(0, filenameTokens.length - 1).join('.') +
        '.' +
        newExtension;
    } else {
      filename = filename + '.' + newExtension;
    }
    return filename;
  }
}
