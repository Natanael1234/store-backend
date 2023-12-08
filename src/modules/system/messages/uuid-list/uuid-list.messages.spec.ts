import { IdConfigs } from '../../configs/id/id.configs';
import { UuidListMessage } from './uuid-list.messages';

const { MAX_ID } = IdConfigs;

describe('IdListMessage', () => {
  it('should be defined', () => {
    expect(UuidListMessage).toBeDefined();
  });

  it("should have valid keys and values when doesn't receives parameters", () => {
    const Messages = new UuidListMessage('test');
    expect({ ...Messages }).toEqual({
      INVALID: 'Invalid test',
      ITEM_INVALID: 'Invalid test item',
      ITEM_NULL: 'Null test item',
      ITEM_REQUIRED: 'Test item is required',
      ITEM_STRING: 'Test item must be string',
      MAX_LEN: 'Test should have a maximum of ' + MAX_ID + ' items',
      MIN_LEN: 'Test should be at least 0 item long',
      NULL: 'Null test',
      REQUIRED: 'Test is required',
    });
  });

  it('should have valid keys and values when receives parameters', () => {
    const Messages = new UuidListMessage('test', {
      minLength: 6,
      maxLength: 60,
    });
    expect({ ...Messages }).toEqual({
      INVALID: 'Invalid test',
      ITEM_INVALID: 'Invalid test item',
      ITEM_NULL: 'Null test item',
      REQUIRED: 'Test is required',
      ITEM_STRING: 'Test item must be string',
      MIN_LEN: 'Test should be at least 6 items long',
      MAX_LEN: 'Test should have a maximum of 60 items',
      NULL: 'Null test',
      ITEM_REQUIRED: 'Test item is required',
    });
  });
});
