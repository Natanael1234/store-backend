import { TextQueryConfigs } from '../../../../configs/text-query/text-query.configs';
import { textQueryTransformer } from './text-query-transformer';

describe('textQueryTransformer', () => {
  it('should be defined', () => {
    expect(textQueryTransformer).toBeDefined();
  });

  it('should accept add format when receives string string', async () => {
    expect(textQueryTransformer('aBcd')).toEqual('%abcd%');
  });

  it('should accept and format when receives string with irregular spaces', () => {
    expect(textQueryTransformer('    a B   cd ')).toEqual('%a%b%cd%');
  });

  it('should accept when receives empty string', () => {
    expect(textQueryTransformer('')).toEqual('');
  });

  it('should accept and transform into empty string when receives string made of spaces', () => {
    expect(textQueryTransformer('   ')).toEqual('');
  });

  it('should accept cut and transform when receives string larger than allowed', () => {
    expect(textQueryTransformer('x'.repeat(30) + ' xxx x  ')).toEqual(
      '%' + 'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH - 5) + '%xxx%',
    );
  });

  it('should accept not cut when receives string with maximum allowed size', () => {
    expect(
      textQueryTransformer('x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH)),
    ).toEqual('%' + 'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH) + '%');
  });

  it('should accept when receives null', () => {
    expect(textQueryTransformer(null)).toEqual(null);
  });

  it('should accept receives undefined', () => {
    expect(textQueryTransformer(undefined)).toEqual(undefined);
  });

  it('should reject when receives boolean', () => {
    expect(textQueryTransformer(true as unknown as string)).toEqual(true);
  });

  it('should reject when receives number', () => {
    expect(textQueryTransformer(1 as unknown as string)).toEqual(1);
  });

  it('should return when receives object', () => {
    expect(textQueryTransformer([] as unknown as string)).toEqual([]);
  });

  it('should reject when receives object', () => {
    expect(textQueryTransformer({} as unknown as string)).toEqual({});
  });
});
