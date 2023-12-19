import { TextMessageOLD } from './text.messages.enum';

describe('TextMessage', () => {
  it('should be defined', () => {
    expect(TextMessageOLD).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...TextMessageOLD }).toEqual({
      REQUIRED: 'Text is required',
      INVALID: 'Text should be string',
    });
  });
});
