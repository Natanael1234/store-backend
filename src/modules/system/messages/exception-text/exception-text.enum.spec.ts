import { ExceptionText } from './exception-text.enum';

describe('ExceptionText', () => {
  it('should be defined', () => {
    expect(ExceptionText).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ExceptionText }).toEqual({
      BAD_REQUEST: 'Bad Request',
      CONFLICT: 'Conflict',
      FORBIDDEN: 'Forbidden',
      NOT_FOUND: 'Not Found',
      UNAUTHORIZED: 'Unauthorized',
      UNPROCESSABLE_ENTITY: 'Unprocessable Entity',
      UNPROCESSABLE_ENTITY_EXCEPTION: 'UnprocessableEntityException',
      UNPROCESSABLE__ENTITY__EXCEPTION: 'Unprocessable Entity Exception',
    });
  });
});
