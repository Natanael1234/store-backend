import { Injectable } from '@nestjs/common';
import { createDecipheriv, createCipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const AES_256_CBC = 'aes-256-cbc';
const UTF8 = 'utf8';
const HEX = 'hex';

@Injectable()
export class EncryptionService {
  async encrypt(
    textToEncrypt: string,
  ): Promise<{ iv: string; encryptedData: string }> {
    const secretKey = await this.getSecretKey();
    const initVector = randomBytes(16);
    const cipher = await createCipheriv(AES_256_CBC, secretKey, initVector);
    const encrypted = Buffer.concat([
      cipher.update(textToEncrypt),
      cipher.final(),
    ]);
    return {
      iv: initVector.toString(HEX),
      encryptedData: encrypted.toString(HEX),
    };
  }

  async decrypt(encryptedData: any): Promise<string> {
    const encryptedText = Buffer.from(encryptedData.encryptedData, HEX);
    const key = await this.getSecretKey();
    const initVector = Buffer.from(encryptedData.iv, HEX);
    const decipher = createDecipheriv(AES_256_CBC, key, initVector);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString();
  }

  private async getSecretKey() {
    return (await promisify(scrypt)(
      process.env.CRYPTO_PASSWORD,
      'salt',
      32,
    )) as Buffer;
  }
}
