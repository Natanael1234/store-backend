export class SaveFileMetadataDto {
  name?: string;

  description?: string;

  main?: boolean;

  active?: boolean;

  delete?: boolean;

  imageId?: string;

  imageIdx?: number;

  file?: Express.Multer.File;
}
