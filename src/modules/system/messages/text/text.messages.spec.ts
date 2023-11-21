import { TextMessage } from './text.messages';

describe('TextMessage', () => {
  it('should be defined', () => {
    expect(TextMessage).toBeDefined();
  });

  it("should have valid keys and values when doesn't receives parameters", () => {
    const Messages = new TextMessage('test');
    expect({ ...Messages }).toEqual({
      INVALID: 'Invalid test',
      MAX_LEN: 'Test too long',
      MIN_LEN: 'Test too short',
      NULL: 'Null test',
      REQUIRED: 'Test is required',
      options: undefined,
    });
  });

  it('should have valid keys and values when receives parameters', () => {
    const Messages = new TextMessage('test', { minLength: 6, maxLength: 60 });
    expect({ ...Messages }).toEqual({
      INVALID: 'Invalid test',
      MAX_LEN: 'Test should have a maximum of 60 characters',
      MIN_LEN: 'Test should be at least 6 characters long',
      NULL: 'Null test',
      REQUIRED: 'Test is required',
      options: undefined,
    });
  });
});
