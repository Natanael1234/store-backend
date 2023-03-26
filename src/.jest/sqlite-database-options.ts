import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const sqlitDatabaseOptions: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: ':memory:',
  autoLoadEntities: true,
  synchronize: true,
};
