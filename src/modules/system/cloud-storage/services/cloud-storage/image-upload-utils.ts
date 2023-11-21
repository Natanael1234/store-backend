import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as path from 'path';

function listDisjunctionStr(list: any[]): string {
  if (!list || list.length < 2) {
    return list.join(',');
  }
  const tail = list.pop();
  const str = list.join(', ') + ' or ' + tail;
  return str;
}
const maxFiles = 10;
const maxFileSize = 1024 * 1024 * 0.5;
const allowedFileTypes: RegExp = /jpeg|jpg|png|gif|webp/;
export const allowedImageFileTypes = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
const invalidFormatMessage =
  'Invalid file format. Expected ' +
  listDisjunctionStr(allowedImageFileTypes) +
  '.';

const parseFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: maxFileSize }),
    new FileTypeValidator({ fileType: allowedFileTypes }),
  ],
});

const extFilter = (req, file, callback) => {
  let ext = path.extname(file.originalname);
  if (!allowedImageFileTypes.includes(ext)) {
    req.fileValidationError = invalidFormatMessage;
    return callback(new BadRequestException(invalidFormatMessage), false);
  }
  return callback(null, true);
};

export function getImageFilesInterceptor() {
  return FilesInterceptor('images', maxFiles, {
    limits: { files: maxFiles, fileSize: maxFileSize },
    fileFilter: extFilter,
  });
}
