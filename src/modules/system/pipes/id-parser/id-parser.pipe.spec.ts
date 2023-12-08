import { IdConfigs } from '../../configs/id/id.configs';
import { IdMessage } from '../../messages/id/id.messages';
import { IdParserPipe } from './id-parser.pipe';

const { MIN_ID, MAX_ID } = IdConfigs;
const Message = new IdMessage('user id');

describe('IdParserPipe', () => {
  let pipe: IdParserPipe;

  beforeEach(() => {
    pipe = new IdParserPipe('user id');
  });

  it('should be defined', () => {
    expect(new IdParserPipe('user id')).toBeDefined();
  });

  it('should transform minimum allowed integer parameter into number', () => {
    const transformedValue = pipe.transform(`${MIN_ID}`, {
      type: 'param',
      metatype: Number,
      data: 'user id',
    });
    expect(transformedValue).toBe(MIN_ID);
  });

  it('should transform maximum allowed integer parameter into number', () => {
    const transformedValue = pipe.transform(`${MAX_ID}`, {
      type: 'param',
      metatype: Number,
      data: 'user id',
    });
    expect(transformedValue).toBe(MAX_ID);
  });

  it('should throw a BadRequestException for an invalid empty string parameter', () => {
    expect(() =>
      pipe.transform('', {
        type: 'param',
        metatype: Number,
        data: 'user id',
      }),
    ).toThrowError(Message.INVALID);
  });

  it('should throw a BadRequestException for an invalid string parameter', () => {
    expect(() =>
      pipe.transform('invalid', {
        type: 'param',
        metatype: Number,
        data: 'user id',
      }),
    ).toThrowError(Message.INVALID);
  });

  it('should throw a BadRequestException for a float string parameter', () => {
    expect(() =>
      pipe.transform('1.1', {
        type: 'param',
        metatype: Number,
        data: 'user id',
      }),
    ).toThrowError(Message.INT);
  });

  it('should throw a BadRequestException for a int parameter lower than allowed', () => {
    expect(() =>
      pipe.transform(`${MIN_ID - 1}`, {
        type: 'param',
        metatype: Number,
        data: 'user id',
      }),
    ).toThrowError(Message.MIN);
  });

  it('should throw a BadRequestException for a int parameter higher than allowed', () => {
    expect(() =>
      pipe.transform(`${MAX_ID + 1}`, {
        type: 'param',
        metatype: Number,
        data: 'user id',
      }),
    ).toThrowError(Message.MAX);
  });
});
