import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { ValidationArguments, registerDecorator } from 'class-validator';
import { ProductImageConfigs } from '../../../stock/product-image/configs/product-image/product-image.configs';
import { SaveMetadataItemDto } from '../../dtos/save-metadata-item/save-metadata-item.dto';
import { ImagesMetadataMessage } from '../../messages/images-metadata/images-metadata.messages.enum';

const { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } = ProductImageConfigs;

interface ValidationOptions {
  nameMaxSize: number;
  descriptionMaxSize: number;
}

/**
 * File metadata array validator.
 */
function IsFileMetadata(options: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFileMetadata',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {},
      validator: {
        validate(metadataArray: any[], args: ValidationArguments) {
          // is null
          // TODO: não aceitar mais null?
          if (metadataArray == null) {
            return false;
          }

          // is not array
          else if (!Array.isArray(metadataArray)) {
            return false;
          }

          // // array length
          // if (!metadataArray.length) {
          //   return false;
          // }

          // array items
          for (const metadataItem of metadataArray) {
            // item
            if (metadataItem == null) {
              return false;
            }
            if (
              typeof metadataItem != 'object' ||
              Array.isArray(metadataItem)
            ) {
              return false;
            }
          }

          // main count
          const mainCount = metadataArray.filter(
            (metadataItem) => metadataItem.main,
          );
          if (mainCount.length > 1) {
            return false;
          }

          // repeated ids
          const ids = metadataArray
            .filter((metadataItem) => metadataItem.imageId != undefined)
            .map((value) => value.imageId);

          const hasRepeatedIds = [...new Set(ids)].length != ids.length;
          if (hasRepeatedIds) {
            return false;
          }

          // repeated indexes
          const idxs = metadataArray
            .filter((metadataItem) => metadataItem.fileIdx != undefined)
            .map((metadataItem) => metadataItem.fileIdx);
          const hasRepeatedIdxs = [...new Set(idxs)].length != idxs.length;
          if (hasRepeatedIdxs) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const { value: metadataArray } = args;

          // values
          if (metadataArray == null) {
            return ImagesMetadataMessage.METADATA_NOT_DEFINED;
          } else if (!Array.isArray(metadataArray)) {
            return ImagesMetadataMessage.METADATA_ARRAY_INVALID;
          }

          // // array length
          // if (!metadataArray.length) {
          //   return ImageMessage.IMAGE_LIST_NOT_DEFINED;
          // }

          // array items
          for (const metadataItem of metadataArray) {
            if (metadataItem == null) {
              return ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED;
            }
            if (
              typeof metadataItem != 'object' ||
              Array.isArray(metadataItem)
            ) {
              return ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE;
            }
          }

          // multiple mains
          const mainCount = metadataArray.filter((value) => value.main);
          if (mainCount.length > 1) {
            return ImagesMetadataMessage.MULTIPLE_MAINS;
          }

          // repeated ids
          const ids = metadataArray
            .filter((metadataItem) => metadataItem.imageId != undefined)
            .map((value) => value.imageId);

          const hasRepeatedIds = [...new Set(ids)].length != ids.length;
          if (hasRepeatedIds) {
            return ImagesMetadataMessage.IMAGE_ID_DUPLICATED;
          }

          // repeated indexes
          const idxs = metadataArray
            .filter((metadataItem) => metadataItem.fileIdx != undefined)
            .map((metadataItem) => metadataItem.fileIdx);

          const hasRepeatedIdxs = [...new Set(idxs)].length != idxs.length;
          if (hasRepeatedIdxs) {
            return ImagesMetadataMessage.FILE_IDX_DUPLICATED;
          }
        },
      },
    });
  };
}

/**
 * Should parse an array into an array of file metadata dtos.
 * @param items should receive an array ob objects in the format of file metadata dto.
 * @returns If items is null or undefined, it returns null or undefined. If items is not array return items original value. If the items is an array, it returns an array of file metadata dtos. Array items that cannot be converted to file metadata dto stay as they are.
 */
function mapToDTOArray(items: any[]): SaveMetadataItemDto[] {
  // if null
  if (items == null) {
    return items;
  }

  // if not array
  if (!Array.isArray(items)) {
    return items;
  }

  // try to map array to array of of file metadata dtos.
  const mappedItems: SaveMetadataItemDto[] = items.map((item) => {
    if (!item || Array.isArray(item) || typeof item != 'object') {
      return item;
    }
    let dto = new SaveMetadataItemDto();

    // name
    if (item.name !== undefined) {
      dto.name = item.name;
    }
    // description
    if (item.description !== undefined) {
      dto.description = item.description;
    }

    // main
    if (item.main === true) {
      dto.main = true;
    } else if (item.main === false) {
      dto.main = false;
    } else {
      dto.main = item.main;
    }

    // active
    if (item.active === true) {
      dto.active = true;
    } else if (item.active === false) {
      dto.active = false;
    } else {
      dto.active = item.active;
    }

    // delete
    if (item.delete === true) {
      dto.delete = true;
    } else if (item.delete === false) {
      dto.delete = false;
    } else {
      dto.delete = item.delete;
    }

    // imageId
    if (item.imageId != undefined) {
      dto.imageId = item.imageId;
    }

    // fileIdx
    if (item.fileIdx != undefined) {
      dto.fileIdx = item.fileIdx;
    }

    return dto;
  });

  return mappedItems;
}

/**
 * If value is string try to parse it as array fo file metadata dto or as null. Otherwise, keep the value as it is.
 * @param params.value data to be parsed to file metadata dto. Dhould be an array of file metadata dto, an string json containing an array of file metadata dto or null.
 * @returns If params.value is string try to parse it as array or as null. Otherwise, keep the value as it is.
 */
function transform(value: any) {
  if (value != null && typeof value == 'object' && Array.isArray(value)) {
    const dtos = mapToDTOArray(value);
    return dtos;
  }
  return value;
}

/**
 * File metadata decorator. Transform and validate property value as filemetadata array.
 * @returns file metadata decorator.
 */
export function ImagesMetadata() {
  const decorators = applyDecorators(
    IsFileMetadata({
      nameMaxSize: NAME_MAX_LENGTH,
      descriptionMaxSize: DESCRIPTION_MAX_LENGTH,
    }),
    Transform((params) => {
      return transform(params.value);
    }),
    Expose(),
  );
  return decorators;
}
