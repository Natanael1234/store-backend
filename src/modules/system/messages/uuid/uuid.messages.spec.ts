import { UuidMessage } from './uuid.messages';

describe('UuidMessage', () => {
  it('should be defined', () => {
    expect(UuidMessage).toBeDefined();
  });

  it("should have valid keys and values when doesn't receives parameters", () => {
    const Messages = new UuidMessage('test');
    expect({ ...Messages }).toEqual({
      STRING: 'Test must be string',
      INVALID: 'Invalid test',
      NULL: 'Null test',
      REQUIRED: 'Test is required',
    });
  });
});
