import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import {
  CloudStorageConfigs,
  CloudStorageService,
} from './services/cloud-storage/cloud-storage.service';

@Module({
  imports: [
    MulterModule.register({}),
    // ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'public') }),
  ],
})
export class CloudStorageModule {
  static forRoot(storageConfigs: CloudStorageConfigs) {
    return {
      module: CloudStorageModule,
      providers: [
        {
          provide: CloudStorageService,
          useValue: new CloudStorageService(storageConfigs),
        },
      ],
      exports: [CloudStorageService],
    };
  }
}
