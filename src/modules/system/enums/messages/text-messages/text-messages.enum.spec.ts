import { TextMessage } from './text-messages.enum';

describe('TextMessage', () => {
  it('should be defined', () => {
    expect(TextMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...TextMessage }).toEqual({
      REQUIRED: 'Text is required',
      STRING: 'Text must be string',
    });
  });
});
