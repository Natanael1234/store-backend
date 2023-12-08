import { ValidationArguments } from 'class-validator';

import { registerDecorator } from 'class-validator';
import { FileMessage } from '../../messages/file/file.messages.enum';
import { isMulterFile } from '../../utils/validation/multer-file/is-valid-multer-file-fn';

export type IsFileConstrantOptions = {
  label: string;
  allowUndefined?: boolean;
  allowNull?: boolean;
};

export function IsMulterFile(options: IsFileConstrantOptions) {
  function isValidFile<T>(file: Express.Multer.File) {
    if (file === null) {
      return !!options?.allowNull;
    }
    if (file === undefined) {
      return !!options?.allowUndefined;
    }
    if (typeof file != 'object' && Array.isArray(file)) {
      return false;
    }
    return isMulterFile(file);
  }

  function getFileErrorMessage<T>(file: Express.Multer.File) {
    if (file === null && !options?.allowNull) {
      return FileMessage.FILE_NOT_DEFINED;
    }
    if (file === undefined && !options?.allowUndefined) {
      return FileMessage.FILE_NOT_DEFINED;
    }
    return FileMessage.INVALID_FILE;
  }

  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFile',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {},
      validator: {
        validate(file: any, args: ValidationArguments) {
          return isValidFile(file);
        },
        defaultMessage(args: ValidationArguments) {
          const message = getFileErrorMessage(args.value);
          return message;
        },
      },
    });
  };
}
