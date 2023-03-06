export class DatabaseConfig {
  public static get DB_TYPE() {
    return process.env.DB_TYPE;
  }
  public static get DB_HOST() {
    return process.env.DB_HOST;
  }
  public static get DB_PORT() {
    return Number(process.env.DB_PORT);
  }
  public static get DB_DATABASE_NAME() {
    return process.env.DB_DATABASE_NAME;
  }
  public static get DB_USERNAME() {
    return process.env.DB_USERNAME;
  }
  public static get DB_PASSWORD() {
    return process.env.DB_PASSWORD;
  }
}
