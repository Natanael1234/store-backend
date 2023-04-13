import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const sqlitDatabaseOptions: TypeOrmModuleOptions = {
  type: 'sqlite',
  // type: 'better-sqlite3',
  database: ':memory:',
  autoLoadEntities: true,
  synchronize: true,
};
