import {
  Body,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { IsNotEmpty, IsString } from 'class-validator';
import { FileRepository } from '../../repositories/file/file.repository';

export class UploadImagesDTO {
  @IsNotEmpty()
  @IsString()
  description: string;
}

const maxFiles = 10;
const maxFileSize = 1024 * 1024 * 50;
const allowedFileTypes: RegExp = /jpeg|jpg|png|gif|webp/;

@Controller('image')
export class ImageController {
  constructor(private readonly fileRepo: FileRepository) {}

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
    }),
  )
  async uploadFile(
    @Body() body: { test: string },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: maxFileSize }),
          new FileTypeValidator({ fileType: allowedFileTypes }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    await this.fileRepo.saveFiles([file], 'images');
  }

  @Post('upload/multiple')
  @UseInterceptors(
    FilesInterceptor('files', maxFiles, {
      limits: { files: maxFiles, fileSize: maxFileSize },
    }),
  )
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: maxFileSize }),
          new FileTypeValidator({ fileType: allowedFileTypes }),
        ],
      }),
    )
    images: Array<Express.Multer.File>,
    @Body() imagesDto: UploadImagesDTO,
  ) {
    await this.fileRepo.saveFiles(images, 'images');
  }
}
