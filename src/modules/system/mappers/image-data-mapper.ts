import { UnprocessableEntityException } from '@nestjs/common';
import { SaveImageItemDto } from '../dtos/save-image-item-dto/save-image-item.dto';
import { SaveMetadataItemDto } from '../dtos/save-metadata-item/save-metadata-item.dto';
import { FileMessage } from '../messages/file/file.messages.enum';
import { ImagesMetadataMessage } from '../messages/images-metadata/images-metadata.messages.enum';

export function imageDataMapper(
  files: Express.Multer.File[],
  metadataArr: SaveMetadataItemDto[],
): SaveImageItemDto[] {
  const ret: SaveImageItemDto[] = [];
  if (files == null) {
    throw new UnprocessableEntityException(FileMessage.FILES_NOT_DEFINED);
  }
  if (!Array.isArray(files)) {
    throw new UnprocessableEntityException(FileMessage.INVALID_FILE_LIST);
  }
  for (const file of files) {
    if (file == null) {
      throw new UnprocessableEntityException(FileMessage.FILE_NOT_DEFINED);
    }
    if (typeof file != 'object' || Array.isArray(file)) {
      throw new UnprocessableEntityException(FileMessage.INVALID_FILE);
    }
  }

  if (metadataArr == null) {
    throw new UnprocessableEntityException(
      ImagesMetadataMessage.METADATA_NOT_DEFINED,
    );
  }
  if (!Array.isArray(metadataArr)) {
    throw new UnprocessableEntityException(
      ImagesMetadataMessage.METADATA_INVALID,
    );
  }
  for (const metadataItem of metadataArr) {
    if (metadataItem == null) {
      throw new UnprocessableEntityException(
        ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED,
      );
    }
    if (typeof metadataItem != 'object' || Array.isArray(metadataItem)) {
      throw new UnprocessableEntityException(
        ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE,
      );
    }
  }

  // create new images for files with related metadata
  for (const metadataItem of metadataArr) {
    const saveFileItem = new SaveImageItemDto();
    saveFileItem.name = metadataItem.name;
    saveFileItem.description = metadataItem.description;
    saveFileItem.main = metadataItem.main;
    saveFileItem.active = metadataItem.active;
    saveFileItem.delete = metadataItem.delete;
    saveFileItem.imageId = metadataItem.imageId;
    if (metadataItem?.fileIdx != null) {
      if (typeof metadataItem?.fileIdx == 'number') {
        if (metadataItem.fileIdx >= 0 && metadataItem.fileIdx < files?.length) {
          saveFileItem.file = files[metadataItem.fileIdx];
        } else {
          throw new UnprocessableEntityException(
            ImagesMetadataMessage.FILE_IDX_NOT_FOUND,
          );
        }
      } else {
        throw new UnprocessableEntityException(
          ImagesMetadataMessage.FILE_IDX_INVALID,
        );
      }
    }
    ret.push(saveFileItem);
  }

  // create new images for files with no related metadata
  for (let i = 0; i < files?.length; i++) {
    const existentSaveFileItem = metadataArr.find((metadata) => {
      return metadata?.fileIdx == i;
    });
    if (!existentSaveFileItem) {
      const saveFileItem = new SaveImageItemDto();
      saveFileItem.file = files[i];
      ret.push(saveFileItem);
    }
  }

  return ret;
}
