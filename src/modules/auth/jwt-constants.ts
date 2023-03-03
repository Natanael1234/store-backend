export const jwtConstants = {
  secret: process.env.ACCESS_TOKEN_SECRET,
  // secret: process.env.ACCESS_TOKEN_SECRET, // TODO: modificar para não ser exposta (https://docs.nestjs.com/security/authentication)
  /**
   * Do not expose this key publicly. We have done so here to make it clear what the code is doing, but in a production system you must protect this key using appropriate measures such as a secrets vault, environment variable, or configuration service.
   */
};
