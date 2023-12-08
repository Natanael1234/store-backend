import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfigs } from './configs/database.configs';

const options = {
  type: DatabaseConfigs.DB_TYPE,
  username: DatabaseConfigs.DB_USERNAME,
  password: DatabaseConfigs.DB_PASSWORD,
  database: DatabaseConfigs.DB_DATABASE_NAME,
  host: DatabaseConfigs.DB_HOST,
  port: DatabaseConfigs.DB_PORT,
  autoLoadEntities: true,
  synchronize: true,
};

@Module({
  imports: [TypeOrmModule.forRoot(options as TypeOrmModuleOptions)],
})
export class DatabaseModule {}
