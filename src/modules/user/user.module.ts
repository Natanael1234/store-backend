import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EncryptionModule } from '../system/encryption/encryption.module';
import { UserController } from './controllers/user.controller';
import { RolesGuard } from './guards/roles/roles.guard';
import { UserEntity } from './models/user/user.entity';
import { UserService } from './services/user/user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), EncryptionModule],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
