import { envTestParameters } from '../../../../.jest/env-test-parameters';
import { EncryptationConfigs } from './encryptation.config';

describe('EncryptionService', () => {
  it('EncryptationConfigs should be defined', () => {
    expect(EncryptationConfigs).toBeDefined();
  });

  it('Algorithm should be defined', () => {
    expect(EncryptationConfigs.ALGOTITHM).toEqual('aes-256-cbc');
  });

  it('Decrypted value enconding should be defined', () => {
    expect(EncryptationConfigs.DECRYPTED_ENCONDING).toEqual('utf8');
  });

  it('Encrypted enconding should be defined', () => {
    expect(EncryptationConfigs.ENCRYPTED_ENCONDING).toEqual('hex');
  });

  it('Crypto password should be defined', () => {
    expect(EncryptationConfigs.CRYPTO_PASSWORD).toEqual(
      envTestParameters.CRYPTO_PASSWORD,
    );
  });
});
