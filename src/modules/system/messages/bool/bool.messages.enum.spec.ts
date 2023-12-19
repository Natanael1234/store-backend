import { BoolMessage } from './bool.messages';

describe('BoolMessage', () => {
  it('should be defined', () => {
    expect(BoolMessage).toBeDefined();
  });

  it('should get null message message', () => {
    const messages = new BoolMessage('test');
    expect(messages.NULL).toEqual('Null test');
  });

  it('should get required message', () => {
    const messages = new BoolMessage('test');
    expect(messages.REQUIRED).toEqual('Test is required');
  });

  it('should get invalid message', () => {
    const messages = new BoolMessage('test');
    expect(messages.INVALID).toEqual('Invalid test');
  });
});
