import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE_NAME,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
