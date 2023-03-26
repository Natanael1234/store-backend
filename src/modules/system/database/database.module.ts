import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DatabaseConfig } from './configs/database.config';

const options = {
  type: DatabaseConfig.DB_TYPE,
  username: DatabaseConfig.DB_USERNAME,
  password: DatabaseConfig.DB_PASSWORD,
  database: DatabaseConfig.DB_DATABASE_NAME,
  host: DatabaseConfig.DB_HOST,
  port: DatabaseConfig.DB_PORT,
  autoLoadEntities: true,
  synchronize: true,
};
console.log(options);

@Module({
  imports: [TypeOrmModule.forRoot(options as TypeOrmModuleOptions)],
})
export class DatabaseModule {}
