import { envTestParameters } from '../../../../.jest/env-test-parameters';
import { EncryptationConfigs } from './encryptation.configs';

describe('EncryptionConfigs', () => {
  it('EncryptationConfigs should be defined', () => {
    expect(EncryptationConfigs).toBeDefined();
  });

  it('ALGOTITHM should be defined', () => {
    expect(EncryptationConfigs.ALGOTITHM).toEqual('aes-256-cbc');
  });

  it('DECRYPTED_ENCONDING enconding should be defined', () => {
    expect(EncryptationConfigs.DECRYPTED_ENCONDING).toEqual('utf8');
  });

  it('DECRYPTED_ENCONDING should be defined', () => {
    expect(EncryptationConfigs.ENCRYPTED_ENCONDING).toEqual('hex');
  });

  it('CRYPTO_PASSWORD should be defined', () => {
    expect(EncryptationConfigs.CRYPTO_PASSWORD).toEqual(
      envTestParameters.CRYPTO_PASSWORD,
    );
  });
});
