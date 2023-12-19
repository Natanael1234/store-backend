import { plainToInstance } from 'class-transformer';
import { TextQueryConfigs } from '../../configs/text-query/text-query.configs';
import { TextMessageOLD } from '../../messages/text-old/text.messages.enum';
import { validateFirstError } from '../../utils/validation/validation';
import { TextQuery } from './text-query.decorator';

async function testAccept(
  data: { textQuery?: string },
  expectedData: { textQuery?: string },
) {
  class Clazz {
    @TextQuery() textQuery: string;
  }
  const dto = plainToInstance(Clazz, data);
  expect(dto).toEqual(expectedData);
  const errors = await validateFirstError(data, Clazz);
  expect(errors).toHaveLength(0);
}

async function testReject(data: { textQuery?: string }, constraints: any) {
  class Clazz {
    @TextQuery() textQuery: string;
  }

  const errors = await validateFirstError({ textQuery: data }, Clazz);
  expect(errors).toHaveLength(1);
  expect(errors[0].constraints).toEqual(constraints);
}

describe('TextQuery decorator', () => {
  it('should be defined', () => {
    expect(TextQuery).toBeDefined();
  });

  it('should accept and format when receives string', async () => {
    await testAccept({ textQuery: 'aBcd' }, { textQuery: '%abcd%' });
  });

  it('should accept and format when receives string with irregular spaces', async () => {
    await testAccept({ textQuery: '    a B   cd ' }, { textQuery: '%a%b%cd%' });
  });

  it('should accept when receives empty string', async () => {
    await testAccept({ textQuery: '' }, { textQuery: '' });
  });

  it('should accept and transform into empty string when receives string made of spaces', async () => {
    await testAccept({ textQuery: '   ' }, { textQuery: '' });
  });

  it('should accept cut and transform when receives string larger than allowed', async () => {
    await testAccept(
      { textQuery: 'x'.repeat(30) + ' xxx x  ' },
      {
        textQuery:
          '%' +
          'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH - 5) +
          '%xxx%',
      },
    );
  });

  it('should accept not cut when receives string with maximum allowed size', async () => {
    await testAccept(
      { textQuery: 'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH) },
      {
        textQuery:
          '%' + 'x'.repeat(TextQueryConfigs.TEXT_QUERY_MAX_LENGTH) + '%',
      },
    );
  });

  it('should accept when receives null', async () => {
    await testAccept({ textQuery: null }, { textQuery: null });
  });

  it('should accept receives undefined', async () => {
    await testAccept({ textQuery: undefined }, { textQuery: undefined });
  });

  it('should reject when receives boolean', async () => {
    await testReject(
      { textQuery: true as unknown as string },
      { isString: TextMessageOLD.INVALID },
    );
  });

  it('should reject when receives number', async () => {
    await testReject(
      { textQuery: 1 as unknown as string },
      { isString: TextMessageOLD.INVALID },
    );
  });

  it('should return when receives array', async () => {
    await testReject(
      { textQuery: [] as unknown as string },
      { isString: TextMessageOLD.INVALID },
    );
  });

  it('should reject when receives object', async () => {
    await testReject(
      { textQuery: {} as unknown as string },
      { isString: TextMessageOLD.INVALID },
    );
  });
});
