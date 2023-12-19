import { MutuallyExclusiveFieldsMessage } from './mutually-exclusive-fields.messages';

describe('MutuallyExclusiveFieldsMessage', () => {
  it('should be defined', () => {
    expect(MutuallyExclusiveFieldsMessage).toBeDefined();
  });

  it('should get null message message', () => {
    const messages = new MutuallyExclusiveFieldsMessage('fieldA', 'fieldB');
    expect(messages.BOTH_DEFINED).toEqual(`Both fieldA and fieldB defined`);
  });

  it('should get required message', () => {
    const messages = new MutuallyExclusiveFieldsMessage('fieldA', 'fieldB');
    expect(messages.NONE_DEFINED).toEqual(
      `Field fieldA or field fieldB should be defined`,
    );
  });
});
