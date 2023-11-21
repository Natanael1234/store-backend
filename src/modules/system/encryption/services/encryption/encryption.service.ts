import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { EncryptationConfigs } from '../../configs/encryptation.configs';
import { EncryptedDataDto } from '../../dtos/encrypted-data.dto';

@Injectable()
export class EncryptionService {
  async encrypt(textToEncrypt: string): Promise<EncryptedDataDto> {
    const secretKey = await this.getSecretKey();
    const initVector = randomBytes(16);
    const cipher = await createCipheriv(
      EncryptationConfigs.ALGOTITHM,
      secretKey,
      initVector,
    );
    const encrypted = Buffer.concat([
      cipher.update(textToEncrypt),
      cipher.final(),
    ]);
    return {
      iv: initVector.toString(EncryptationConfigs.ENCRYPTED_ENCONDING),
      encryptedData: encrypted.toString(
        EncryptationConfigs.ENCRYPTED_ENCONDING,
      ),
    };
  }

  async decrypt(encryptedData: EncryptedDataDto): Promise<string> {
    const encryptedText = Buffer.from(
      encryptedData.encryptedData,
      EncryptationConfigs.ENCRYPTED_ENCONDING,
    );
    const secretKey = await this.getSecretKey();
    const initVector = Buffer.from(
      encryptedData.iv,
      EncryptationConfigs.ENCRYPTED_ENCONDING,
    );
    const decipher = createDecipheriv(
      EncryptationConfigs.ALGOTITHM,
      secretKey,
      initVector,
    );
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);
    return decrypted.toString();
  }

  private async getSecretKey() {
    return (await promisify(scrypt)(
      EncryptationConfigs.CRYPTO_PASSWORD,
      'salt',
      32,
    )) as Buffer;
  }
}
