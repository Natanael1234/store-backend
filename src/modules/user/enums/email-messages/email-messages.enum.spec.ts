import { EmailMessage } from './email-messages.enum';

describe('EmailMessage', () => {
  it('should be defined', () => {
    expect(EmailMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...EmailMessage }).toEqual({
      STRING: 'Email must be string',
      REQUIRED: 'Email is required',
      MAX_LEN: 'Email must have a maximum of 60 characters',
      INVALID: 'Invalid email',
    });
  });
});
