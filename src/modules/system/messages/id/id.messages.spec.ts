import { IdConfigs } from '../../configs/id/id.configs';
import { IdMessage } from './id.messages';

const { MIN_ID, MAX_ID } = IdConfigs;

describe('IdMessage', () => {
  it('should be defined', () => {
    expect(IdMessage).toBeDefined();
  });

  it("should have valid keys and values when doesn't receives parameters", () => {
    const Messages = new IdMessage('test');
    expect({ ...Messages }).toEqual({
      INT: 'Test must be integer',
      INVALID: 'Invalid test',
      MAX: 'Test should be less than or equal to ' + MAX_ID,
      MIN: 'Test should be greater than or equal to ' + MIN_ID,
      NULL: 'Null test',
      REQUIRED: 'Test is required',
    });
  });
});
