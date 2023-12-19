export function isMulterFile(value: Express.Multer.File): boolean {
  if (value == null) {
    return false;
  }
  if (typeof value != 'object' || Array.isArray(value)) {
    return false;
  }

  // if (!('fieldname' in value)) {
  //   return false;
  // }
  if (!('originalname' in value)) {
    return false;
  }
  if (!('encoding' in value)) {
    return false;
  }
  if (!('mimetype' in value)) {
    return false;
  }
  if (!('size' in value)) {
    return false;
  }
  if (!('buffer' in value)) {
    return false;
  }

  if (value.fieldname != null && typeof value.fieldname != 'string') {
    return false;
  }
  if (typeof value.originalname != 'string') {
    return false;
  }
  if (typeof value.encoding != 'string') {
    return false;
  }
  if (typeof value.mimetype != 'string') {
    return false;
  }
  if (typeof value.size != 'number') {
    return false;
  } else if (value.size < 0) {
    return false;
  } else if (!Number.isInteger(value.size)) {
    return false;
  }
  if (!Buffer.isBuffer(value.buffer)) {
    return false;
  }

  return true;
}
