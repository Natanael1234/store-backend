import { testConvertStaticPropertiesToObject } from '../../../../test/test-utils';
import { RefreshTokenConstants } from './refresh-token-entity.constants';

describe('CategoryConstants', () => {
  it('should de defined', () => {
    expect(RefreshTokenConstants).toBeDefined();
  });

  it('sohuld have correct properties', () => {
    const values = testConvertStaticPropertiesToObject(RefreshTokenConstants);
    expect(values).toEqual({
      REFRESH_TOKEN: 'refresh_token',
    });
  });
});
