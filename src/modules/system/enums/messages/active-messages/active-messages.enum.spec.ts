import { ActiveMessage } from './active-messages.enum';

describe('ActiveMessage', () => {
  it('should be defined', () => {
    expect(ActiveMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...ActiveMessage }).toEqual({
      REQUIRED: 'Active is required',
      TYPE: 'Active must be boolean',
      INVALID: 'Active is invalid',
    });
  });
});
