import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserEntity } from '../modules/user/models/user/user.entity';
import { UserService } from '../modules/user/services/user/user.service';
import { EncryptionService } from '../modules/system/encryption/services/encryption/encryption.service';
import { sqlitDatabaseOptions } from './sqlite-database-options';
import { RefreshTokenEntity } from '../modules/auth/models/refresh-token.entity';
import { ModuleMetadata } from '@nestjs/common';

export async function getTestingModule(
  additionalMetadata?: ModuleMetadata,
): Promise<TestingModule> {
  return await Test.createTestingModule({
    imports: [
      TypeOrmModule.forFeature([UserEntity, RefreshTokenEntity]),
      ConfigModule.forRoot({ isGlobal: true }),
      TypeOrmModule.forRoot(sqlitDatabaseOptions),
      ...(additionalMetadata?.imports || []),
    ],
    providers: [
      UserService,
      EncryptionService,
      ...(additionalMetadata?.providers || []),
    ],
    controllers: [...(additionalMetadata?.controllers || [])],
  }).compile();
}
