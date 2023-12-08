export class SaveImageItemDto {
  name?: string;

  description?: string;

  main?: boolean;

  active?: boolean;

  delete?: boolean;

  imageId?: string;

  file?: Express.Multer.File;
}
