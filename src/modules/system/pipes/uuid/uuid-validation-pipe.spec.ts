import { UuidMessage } from '../../messages/uuid/uuid.messages';
import { UuidValidationPipe } from './uuid-validation.pipe';

const Message = new UuidMessage('user id');

describe('UuidValidationPipe', () => {
  let pipe: UuidValidationPipe;

  beforeEach(() => {
    pipe = new UuidValidationPipe('user id');
  });

  it('should be defined', () => {
    expect(new UuidValidationPipe('user id')).toBeDefined();
  });

  it('should validate a valid UUID', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    expect(
      pipe.transform(validUUID, {
        type: 'param',
        metatype: String,
        data: 'user id',
      } as any),
    ).toEqual(validUUID);
  });

  it('should throw a BadRequestException for an invalid empty string parameter', () => {
    expect(() =>
      pipe.transform('', {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.INVALID);
  });

  it('should throw a BadRequestException for an invalid string parameter', () => {
    expect(() =>
      pipe.transform('invalid', {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.INVALID);
  });

  it('should throw a BadRequestException for a null parameter', () => {
    expect(() =>
      pipe.transform(null, {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.STRING);
  });

  it('should throw a BadRequestException for a undefined parameter', () => {
    expect(() =>
      pipe.transform(null, {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.STRING);
  });

  it('should throw a BadRequestException for a number parameter', () => {
    expect(() =>
      pipe.transform(1 as unknown as string, {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.STRING);
  });

  it('should throw a BadRequestException for a boolean parameter', () => {
    expect(() =>
      pipe.transform(true as unknown as string, {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.STRING);
  });

  it('should throw a BadRequestException for a array parameter', () => {
    expect(() =>
      pipe.transform([] as unknown as string, {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.STRING);
  });

  it('should throw a BadRequestException for a object parameter', () => {
    expect(() =>
      pipe.transform({} as unknown as string, {
        type: 'param',
        metatype: String,
        data: 'user id',
      }),
    ).toThrowError(Message.STRING);
  });
});
