import { AcceptTermsMessage } from './accept-terms-messages.enum';

describe('AcceptTermsMessage', () => {
  it('should be defined', () => {
    expect(AcceptTermsMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    expect({ ...AcceptTermsMessage }).toEqual({
      REQUIRED: 'Acceptance of terms is required',
    });
  });
});
