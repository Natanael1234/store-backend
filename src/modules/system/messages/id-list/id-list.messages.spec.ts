import { IdConfigs } from '../../configs/id/id.configs';
import { IdListMessage } from './id-list.messages';

const { MIN_ID, MAX_ID } = IdConfigs;

describe('IdListMessage', () => {
  it('should be defined', () => {
    expect(IdListMessage).toBeDefined();
  });

  it("should have valid keys and values when doesn't receives parameters", () => {
    const Messages = new IdListMessage('test');
    expect({ ...Messages }).toEqual({
      INVALID: 'Invalid test',
      MAX_LEN: 'Test should have a maximum of ' + MAX_ID + ' items',
      MIN_LEN: 'Test should be at least 0 item long',
      NULL: 'Null test',
      REQUIRED: 'Test is required',
      ITEM_INT: 'Test item must be integer',
      ITEM_INVALID: 'Invalid test item',
      ITEM_MIN: 'Test item should be greater than or equal to ' + MIN_ID,
      ITEM_MAX: 'Test item should be less than or equal to ' + MAX_ID,
      ITEM_NULL: 'Null test item',
      ITEM_REQUIRED: 'Test item is required',
    });
  });

  it('should have valid keys and values when receives parameters', () => {
    const Messages = new IdListMessage('test', { minLength: 6, maxLength: 60 });
    expect({ ...Messages }).toEqual({
      INVALID: 'Invalid test',
      MAX_LEN: 'Test should have a maximum of 60 items',
      MIN_LEN: 'Test should be at least 6 items long',
      NULL: 'Null test',
      REQUIRED: 'Test is required',
      ITEM_INVALID: 'Invalid test item',
      ITEM_INT: 'Test item must be integer',
      ITEM_MIN: 'Test item should be greater than or equal to 1',
      ITEM_MAX: 'Test item should be less than or equal to ' + MAX_ID,
      ITEM_NULL: 'Null test item',
      ITEM_REQUIRED: 'Test item is required',
    });
  });
});
