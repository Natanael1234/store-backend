import { v4 as uuidv4 } from 'uuid';
import { isValidUUID } from './is-valid-uuid-fn';

describe('isValidUUID', () => {
  it('should be defined', () => {
    expect(isValidUUID).toBeDefined();
  });

  it('should be a function', () => {
    expect(typeof isValidUUID).toEqual('function');
  });

  it('should return true when receives valid file', async () => {
    expect(isValidUUID(uuidv4())).toEqual(true);
  });

  it('should return false when receives null', async () => {
    expect(isValidUUID(1 as unknown as string)).toEqual(false);
  });

  it('should return false when receives undefined', async () => {
    expect(isValidUUID(1 as unknown as string)).toEqual(false);
  });

  it('should return false when receives number', async () => {
    expect(isValidUUID(1 as unknown as string)).toEqual(false);
  });

  it('should return false when receives boolean', async () => {
    expect(isValidUUID(true as unknown as string)).toEqual(false);
  });

  it('should return false when receives invalid string', async () => {
    expect(isValidUUID('not-a-valid-uuid' as unknown as string)).toEqual(false);
  });

  it('should return false when receives array', async () => {
    expect(isValidUUID([] as unknown as string)).toEqual(false);
  });

  it('should return false when receives object', async () => {
    expect(isValidUUID({} as unknown as string)).toEqual(false);
  });
});
