import { IdConfigs } from '../id/id.configs';
import { IdListConfigs } from './id-list.configs';

const { MIN_ID, MAX_ID } = IdConfigs;

describe('IdListConfigs', () => {
  it('should de defined', () => {
    expect(IdListConfigs).toBeDefined();
  });

  it('should have MIN_ID', () => {
    expect(IdListConfigs.MIN_ID).toEqual(MIN_ID);
  });

  it('should have MAX_ID defined', () => {
    expect(IdListConfigs.MAX_ID).toEqual(MAX_ID);
  });

  it('should have MAX_LENGTH', () => {
    expect(IdListConfigs.MAX_LENGTH).toEqual(MAX_ID);
  });
});
