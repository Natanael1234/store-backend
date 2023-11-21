import { Module } from '@nestjs/common';
import { CloudStorageModule } from '../cloud-storage/cloud-storage.module';
import { MinioCongifs } from '../cloud-storage/configs/minio/minio.configs';
import { ImageService } from './services/image-file/image-file.service';

@Module({
  imports: [
    // TODO: é necessário ainda?
    CloudStorageModule.forRoot({
      endPoint: MinioCongifs.ENDPOINT,
      port: MinioCongifs.PORT,
      useSSL: MinioCongifs.USE_SSL,
      accessKey: MinioCongifs.ACCESS_KEY,
      secretKey: MinioCongifs.SECRET_KEY,
      bucketName: MinioCongifs.BUCKET_NAME,
    }),
  ],
  controllers: [],
  providers: [ImageService],
  exports: [ImageService],
})
export class ImageModule {}
