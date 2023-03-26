export class CachingConfig {
  public static get REDIS_HOST(): string {
    return process.env.REDIS_HOST;
  }

  public static get REDIS_PORT(): string {
    return process.env.REDIS_PORT;
  }
}
