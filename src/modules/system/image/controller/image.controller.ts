import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { Role } from '../../../authentication/enums/role/role.enum';
import { Roles } from '../../../user/decorators/roles/roles.decorator';

import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty, IsString } from 'class-validator';
import * as path from 'path';
import { CloudStorageService } from '../../cloud-storage/services/file/cloud-storage.service';

function listDisjunctionStr(list: any[]): string {
  if (!list || list.length < 2) {
    return list.join(',');
  }
  const tail = list.pop();
  const str = list.join(', ') + ' or ' + tail;
  return str;
}

export class UploadImagesDTO {
  @IsNotEmpty()
  @IsString()
  description: string;
}

const maxFiles = 10;
const maxFileSize = 1024 * 1024 * 0.5;
const allowedFileTypes: RegExp = /jpeg|jpg|png|gif|webp/;
const allowedFileTypesArr = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
const invalidFormatMessage =
  'Invalid file format. Expected ' +
  listDisjunctionStr(allowedFileTypesArr) +
  '.';

const parseFilePipe = new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ maxSize: maxFileSize }),
    new FileTypeValidator({ fileType: allowedFileTypes }),
  ],
});

const extFilter = (req, file, callback) => {
  let ext = path.extname(file.originalname);
  if (!allowedFileTypesArr.includes(ext)) {
    req.fileValidationError = invalidFormatMessage;
    return callback(new BadRequestException(invalidFormatMessage), false);
  }
  return callback(null, true);
};

@Controller('image')
export class ImageController {
  constructor(private readonly fileService: CloudStorageService) {}

  // @Post()
  // create(@Body() createImageDto: CreateImageDto) {
  //   return this.fileRepo.create(createImageDto);
  // }

  // @Get()
  // findAll() {
  //   return this.fileRepo.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.fileRepo.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto) {
  //   return this.fileRepo.update(+id, updateImageDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.fileRepo.remove(+id);
  // }

  @Post('upload/single')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { files: 1, fileSize: maxFileSize },
      fileFilter: extFilter,
    }),
  )
  async save(
    @UploadedFile(parseFilePipe) file: Express.Multer.File,
    @Body() body: { test: string },
  ) {
    return await this.fileService.save([file], 'images/products/');
  }

  @Post('upload/multiple')
  @UseInterceptors(
    FilesInterceptor('files', maxFiles, {
      limits: { files: maxFiles, fileSize: maxFileSize },
      fileFilter: extFilter,
    }),
  )
  saveAll(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() imagesDto: UploadImagesDTO, // : Promise<string[]>
  ) {
    return this.fileService.save(images, 'images/products/');
  }

  @Get('dir')
  list(@Query() imagesDto: { directoryName }) {
    return this.fileService.list(imagesDto.directoryName);
  }

  @Get()
  @Roles(Role.ROOT, Role.ADMIN)
  get(@Query() query: { objectName: string }) {
    return this.fileService.get(query.objectName);
  }

  @Delete('/:brandId')
  @Roles(Role.ROOT, Role.ADMIN)
  delete(@Query() query: { objects: string }) {
    const objects = query.objects?.split(',');
    return this.fileService.delete(objects);
  }
}
