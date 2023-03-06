import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfig } from './database.config';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      username: DatabaseConfig.DB_USERNAME,
      password: DatabaseConfig.DB_PASSWORD,
      database: DatabaseConfig.DB_DATABASE_NAME,
      host: DatabaseConfig.DB_HOST,
      port: DatabaseConfig.DB_PORT,
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
