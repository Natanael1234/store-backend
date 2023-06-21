import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FileRepository } from '../repositories/file/file.repository';
import { ImageController } from './controllers/image.controller';

@Module({
  imports: [
    MulterModule.register({
      // dest: './uploads',
    }),
  ],
  controllers: [ImageController],
  providers: [FileRepository],
})
export class ImageModule {}
