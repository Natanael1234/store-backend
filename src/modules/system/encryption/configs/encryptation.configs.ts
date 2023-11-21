export class EncryptationConfigs {
  public static get ALGOTITHM(): string {
    return 'aes-256-cbc';
  }
  public static get DECRYPTED_ENCONDING(): BufferEncoding {
    return 'utf8';
  }
  public static get ENCRYPTED_ENCONDING(): BufferEncoding {
    return 'hex';
  }

  public static get CRYPTO_PASSWORD(): string {
    return process.env.CRYPTO_PASSWORD;
  }
}
