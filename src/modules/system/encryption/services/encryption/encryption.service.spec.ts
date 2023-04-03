import { TestingModule } from '@nestjs/testing';
import { EncryptionService } from './encryption.service';
import { getTestingModule } from '../../../../../.jest/test-config.module';

describe('EncryptionService', () => {
  let service: EncryptionService;
  const plainData = 'teste';
  let module: TestingModule;

  beforeEach(async () => {
    module = await getTestingModule();
    service = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(async () => {
    await module.close(); // TODO: é necessário?
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should encript data', async () => {
    const encryptedDataDto = await service.encrypt(plainData);

    expect(encryptedDataDto).toBeDefined();

    expect(encryptedDataDto.iv).toBeDefined();
    expect(typeof encryptedDataDto.iv).toEqual('string');
    expect(encryptedDataDto.iv.length).toBeGreaterThan(0);
    expect(encryptedDataDto.iv).not.toEqual(plainData);

    expect(encryptedDataDto.encryptedData).toBeDefined();
    expect(typeof encryptedDataDto.encryptedData).toEqual('string');
    expect(encryptedDataDto.encryptedData.length).toBeGreaterThan(0);
    expect(encryptedDataDto.iv).not.toEqual(plainData);
  });

  it('should decrypt data', async () => {
    const encryptedDataDto = await service.encrypt(plainData);
    const decryptedData = await service.decrypt(encryptedDataDto);

    expect(decryptedData).toEqual(plainData);
  });
});
