export class JWTConfigs {
  /**
   * Do not expose this key publicly. We have done so here to make it clear what the code is doing, but in a production system you must protect this key using appropriate measures such as a secrets vault, environment variable, or configuration service.
   */
  public static get ACCESS_TOKEN_SECRET(): string {
    // TODO: modificar para não ser exposta  (https://docs.nestjs.com/security/authentication)
    return process.env.ACCESS_TOKEN_SECRET;
  }

  public static get ACCESS_TOKEN_EXPIRATION(): string {
    return process.env.ACCESS_TOKEN_EXPIRATION;
  }

  public static get REFRESH_TOKEN_SECRET(): string {
    // TODO: modificar para não ser exposta  (https://docs.nestjs.com/security/authentication)
    return process.env.REFRESH_TOKEN_SECRET;
  }

  public static get REFRESH_TOKEN_EXPIRATION(): string {
    return process.env.REFRESH_TOKEN_EXPIRATION;
  }
}
