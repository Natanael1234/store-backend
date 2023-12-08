import {
  BadRequestException,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as path from 'path';
import { ProductImageConfigs } from '../../../../stock/product-image/configs/product-image/product-image.configs';

function listDisjunctionStr(list: any[]): string {
  if (!list || list.length < 2) {
    return list.join(',');
  }
  const tail = list.pop();
  const str = list.join(', ') + ' or ' + tail;
  return str;
}
const maxFileSize = 1024 * 1024 * 0.5;
const allowedFileTypes: RegExp = /jpeg|jpg|png|gif|webp/;
export const allowedImageFileTypes = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
const invalidFormatMessage =
  'Invalid file format. Expected ' +
  listDisjunctionStr(allowedImageFileTypes) +
  '.';

const tooManyFilesMessage = `Too many files. Maximum allowed is ${
  ProductImageConfigs.MAX_IMAGE_COUNT
} ${ProductImageConfigs.MAX_IMAGE_COUNT < 2 ? 'file' : 'files'}`;

const parseFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: maxFileSize }),
    new FileTypeValidator({ fileType: allowedFileTypes }),
  ],
});

const fileFilter = (req, file, callback) => {
  let ext = path.extname(file.originalname);
  if (!allowedImageFileTypes.includes(ext)) {
    req.fileValidationError = invalidFormatMessage;
    return callback(new BadRequestException(invalidFormatMessage), false);
  }
  if (req.files.length > ProductImageConfigs.MAX_IMAGE_COUNT) {
    const message = `Maximum number of images reached. A product can have a maximum of ${ProductImageConfigs.MAX_IMAGE_COUNT} images`;
    return callback(new BadRequestException(message), false);
    //  ProductImageConfigs.MAX_IMAGE_COUNT, Obs.: Not allow custom messafer
  }
  return callback(null, true);
};

export function getImageFilesInterceptor() {
  return FilesInterceptor(
    'images',
    //  ProductImageConfigs.MAX_IMAGE_COUNT, Obs.: Not allow custom messafer
    null,

    {
      limits: {
        // files: ProductImageConfigs.MAX_IMAGE_COUNT,
        fileSize: maxFileSize,
      },
      fileFilter,
    },
  );
}
