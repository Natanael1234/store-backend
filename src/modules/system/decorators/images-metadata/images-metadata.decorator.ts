import { applyDecorators } from '@nestjs/common';
import { Expose, Transform } from 'class-transformer';
import { ValidationArguments, registerDecorator } from 'class-validator';
import { ProductImageConfigs } from '../../../stock/product-image/configs/product-image/product-image.configs';
import { TextMessage } from '../../messages/text/text.messages';
import { isValidUUID } from '../../utils/validation/is-valid-uuid-fn';
import { ImagesMetadataMessage } from './messages/images-metadata/images-metadata.messages.enum';
import { SaveFileMetadataDto } from './save-file-metadata.dto';

const { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } = ProductImageConfigs;

interface ValidationOptions {
  nameMaxSize: number;
  descriptionMaxSize: number;
}

function validateMetadataItem(
  value: SaveFileMetadataDto,
  mameMaxLength?: number,
  descriptionMaxLength?: number,
) {
  if (value == null) {
    return false;
  }
  if (!(value instanceof SaveFileMetadataDto)) {
    return false;
  }

  // name

  if (value?.name != null && typeof value?.name != 'string') {
    return false;
  }

  if (
    value &&
    value.name &&
    typeof value.name == 'string' &&
    value.name.length > mameMaxLength
  ) {
    return false;
  }

  // description

  if (value?.description != null && typeof value?.description != 'string') {
    return false;
  }
  if (
    value &&
    value.description &&
    typeof value.description == 'string' &&
    value.description.length > descriptionMaxLength
  ) {
    return false;
  }

  // main
  if (value.main === null) {
    return false;
  }
  if (value.main != null && value.main !== true && value.main !== false) {
    return false;
  }

  // active
  if (value.active === null) {
    return false;
  }
  if (value.active != null && value.active !== true && value.active !== false) {
    return false;
  }

  // delete
  if (value.delete === null) {
    return false;
  }
  if (value.delete != null && value.delete !== true && value.delete !== false) {
    return false;
  }

  // imageId

  if (value.imageId !== undefined) {
    if (value.imageId != undefined && !isValidUUID(value.imageId)) {
      return false;
    }
  }

  // imageIdx

  if (value.imageIdx !== undefined) {
    if (value.imageIdx === null) {
      return false;
    }
    if (typeof value.imageIdx != 'number') {
      return false;
    }
    if (!Number.isInteger(value.imageIdx)) {
      return false;
    }
    if (value.imageIdx < 0) {
      return false;
    }
  }

  // imageId and imageIdx

  if (value.imageId !== undefined && value.imageIdx !== undefined) {
    return false; // fails if both are defined
  }

  if (value.imageId === undefined && value.imageIdx === undefined) {
    return false; // fails if both are undefined
  }
}

/**
 * Checks if values is valid file metadata array.
 * @param values should be array of file metadata dto or null.
 * @returns true if valid. False otherwise.
 */
function validateMetadataArray(values: any, options?: ValidationOptions) {
  const _mameMaxLength =
    options && options.nameMaxSize != null
      ? options.nameMaxSize
      : NAME_MAX_LENGTH;

  const _descriptionMaxLength =
    options && options.descriptionMaxSize != null
      ? options.descriptionMaxSize
      : DESCRIPTION_MAX_LENGTH;

  // is null

  if (values == null) {
    return true;
  }

  // is not array
  else if (!Array.isArray(values)) {
    return false;
  }

  // array

  for (const value of values) {
    // item

    const valid = validateMetadataItem(
      value,
      _mameMaxLength,
      _descriptionMaxLength,
    );

    if (valid === false) {
      return false;
    }
  }

  // main count

  const mainCount = values.filter((value) => value.main);
  if (mainCount.length > 1) {
    return false;
  }

  // repeated ids

  const ids = values
    .filter((value) => value.imageId != undefined)
    .map((value) => value.imageId);

  const hasRepeatedIds = [...new Set(ids)].length != ids.length;
  if (hasRepeatedIds) {
    return false;
  }

  // repeated indexes

  const idxs = values
    .filter((value) => value.imageIdx != undefined)
    .map((value) => value.imageIdx);

  const hasRepeatedIdxs = [...new Set(idxs)].length != idxs.length;
  if (hasRepeatedIdxs) {
    return false;
  }

  return true;
}

function getMetadataItemErrorMessage(
  value: any,
  NameMessage: TextMessage,
  DescriptionMessage: TextMessage,
) {
  if (value == null) {
    return ImagesMetadataMessage.METADATA_ITEM_NOT_DEFINED;
  }
  if (!(value instanceof SaveFileMetadataDto)) {
    return ImagesMetadataMessage.METADATA_ITEM_INVALID_TYPE;
  }

  // name

  if (value?.name != null && typeof value?.name != 'string') {
    return NameMessage.INVALID;
  }
  if (
    value &&
    value.name &&
    typeof value.name == 'string' &&
    value.name.length > NAME_MAX_LENGTH
  ) {
    return NameMessage.MAX_LEN;
  }

  // description

  if (value?.description != null && typeof value?.description != 'string') {
    return DescriptionMessage.INVALID;
  }
  if (
    value &&
    value.description &&
    typeof value.description == 'string' &&
    value.description.length > DESCRIPTION_MAX_LENGTH
  ) {
    return DescriptionMessage.MAX_LEN;
  }

  // main

  if (value.main === null) {
    return ImagesMetadataMessage.MAIN_IS_NULL;
  }
  if (value.main != null && value.main !== true && value.main !== false) {
    return ImagesMetadataMessage.MAIN_IS_INVALID;
  }

  // active

  if (value.active === null) {
    return ImagesMetadataMessage.ACTIVE_IS_NULL;
  }
  if (value.active != null && value.active !== true && value.active !== false) {
    return ImagesMetadataMessage.ACTIVE_IS_INVALID;
  }

  // delete

  if (value.delete === null) {
    return ImagesMetadataMessage.DELETE_IS_NULL;
  }
  if (value.delete != null && value.delete !== true && value.delete !== false) {
    return ImagesMetadataMessage.DELETE_IS_INVALID;
  }

  // imageId

  if (value.imageId === null) {
    return ImagesMetadataMessage.IMAGE_ID_NOT_DEFINED;
  }
  if (value.imageId !== undefined) {
    if (!isValidUUID(value.imageId)) {
      return ImagesMetadataMessage.IMAGE_ID_INVALID;
    }
  }

  // imageIdx

  if (value.imageIdx === null) {
    return ImagesMetadataMessage.IMAGE_IDX_NOT_DEFINED;
  }
  if (value.imageIdx !== undefined) {
    if (typeof value.imageIdx != 'number') {
      return ImagesMetadataMessage.IMAGE_IDX_INVALID;
    }
    if (value.imageIdx < 0) {
      return ImagesMetadataMessage.IMAGE_IDX_INVALID;
    }
    if (!Number.isInteger(value.imageIdx)) {
      return ImagesMetadataMessage.IMAGE_IDX_INVALID;
    }
  }

  // imageId and imageIdx

  if (value.imageId == undefined && value.imageIdx == undefined) {
    return ImagesMetadataMessage.IMAGE_ID_AND_IMAGE_IDX_NOT_DEFINED;
  }

  if (value.imageId != undefined && value.imageIdx != undefined) {
    return ImagesMetadataMessage.IMAGE_ID_AND_IMAGE_IDX_DEFINED;
  }
}

/**
 * Get file metadata validation message.
 * @param values array of file metadata dto.
 * @returns validation message if invalid.
 */
function getMetadataArrayErrorMessage(values: any, options: ValidationOptions) {
  // values

  if (values == null) {
    return;
  } else if (!Array.isArray(values)) {
    return ImagesMetadataMessage.METADATA_ARRAY_INVALID;
  }

  // name

  const NameMessage = new TextMessage('name', {
    maxLength: options?.nameMaxSize,
  });

  // description

  const DescriptionMessage = new TextMessage('description', {
    maxLength: options?.descriptionMaxSize,
  });

  // array

  for (const value of values) {
    // item

    const message = getMetadataItemErrorMessage(
      value,
      NameMessage,
      DescriptionMessage,
    );
    if (message != null) {
      return message;
    }
  }

  // multiple mains

  const mainCount = values.filter((value) => value.main);
  if (mainCount.length > 1) {
    return ImagesMetadataMessage.MULTIPLE_MAINS;
  }

  // repeated ids

  const ids = values
    .filter((value) => value.imageId != undefined)
    .map((value) => value.imageId);

  const hasRepeatedIds = [...new Set(ids)].length != ids.length;
  if (hasRepeatedIds) {
    return ImagesMetadataMessage.IMAGE_ID_DUPLICATED;
  }

  // repeated indexes

  const idxs = values
    .filter((value) => value.imageIdx != undefined)
    .map((value) => value.imageIdx);

  const hasRepeatedIdxs = [...new Set(idxs)].length != idxs.length;
  if (hasRepeatedIdxs) {
    return ImagesMetadataMessage.IMAGE_IDX_DUPLICATED;
  }
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
        validate(values: any[], args: ValidationArguments) {
          return validateMetadataArray(values, options);
        },
        defaultMessage(args: ValidationArguments) {
          const { value: values } = args;
          return getMetadataArrayErrorMessage(values, options);
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
function mapToDTOArray(items: any[]): SaveFileMetadataDto[] {
  // if null
  if (items == null) {
    return items;
  }

  // if not array
  if (!Array.isArray(items)) {
    return items;
  }

  // try to map array to array of of file metadata dtos.
  const mappedItems: SaveFileMetadataDto[] = items.map((item) => {
    if (!item || Array.isArray(item) || typeof item != 'object') {
      return item;
    }
    let dto = new SaveFileMetadataDto();

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

    // imageIdx

    if (item.imageIdx != undefined) {
      dto.imageIdx = item.imageIdx;
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
