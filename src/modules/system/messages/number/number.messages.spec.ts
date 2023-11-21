import { NumberMessage } from './number.messages';

describe('NumberMessage', () => {
  it('should be defined', () => {
    expect(NumberMessage).toBeDefined();
  });

  it('should be defined', () => {
    expect(NumberMessage).toBeDefined();
  });

  it("should have valid keys and values when doesn't receives parameters", () => {
    const Messages = new NumberMessage('test');
    expect({ ...Messages }).toEqual({
      INT: 'Test must be integer',
      INVALID: 'Invalid test',
      MIN: 'Test should be greater than or equal to ' + Number.MIN_SAFE_INTEGER,
      MAX: 'Test should be less than or equal to ' + Number.MAX_SAFE_INTEGER,
      NULL: 'Null test',
      REQUIRED: 'Test is required',
    });
  });

  it('should have valid keys and values when receives parameters', () => {
    const Messages = new NumberMessage('test', { min: 6, max: 60 });
    expect({ ...Messages }).toEqual({
      INT: 'Test must be integer',
      INVALID: 'Invalid test',
      MIN: 'Test should be greater than or equal to 6',
      MAX: 'Test should be less than or equal to 60',
      NULL: 'Null test',
      REQUIRED: 'Test is required',
    });
  });
});
