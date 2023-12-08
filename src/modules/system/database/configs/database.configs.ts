import { DatabaseType } from 'typeorm';

export class DatabaseConfigs {
  public static get DB_TYPE(): DatabaseType {
    const databaseType: DatabaseType = process.env.DB_TYPE as DatabaseType;
    return databaseType;
  }

  public static get DB_HOST(): string {
    return process.env.DB_HOST;
  }

  public static get DB_PORT(): number {
    return Number(process.env.DB_PORT);
  }

  public static get DB_DATABASE_NAME(): string {
    return process.env.DB_DATABASE_NAME;
  }

  public static get DB_USERNAME(): string {
    return process.env.DB_USERNAME;
  }

  public static get DB_PASSWORD(): string {
    return process.env.DB_PASSWORD;
  }
}
