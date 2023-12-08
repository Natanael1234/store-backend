import { StorageMessage } from './storage.messages';

describe('StorageMessage', () => {
  it('should be defined', () => {
    expect(StorageMessage).toBeDefined();
  });

  it('should have valid keys and values', () => {
    const Messages = new StorageMessage();
    expect({ ...Messages }).toEqual({
      OBJECT_NAME_NULL: 'Null object name',
      OBJECT_NAME_REQUIRED: 'Object name is required',
      OBJECT_NAME_INVALID: 'Invalid object name',
      OBJECT_NOT_FOUND: 'Object not found',

      OBJECT_NAME_LIST_NULL: 'Null object name list',
      OBJECT_NAME_LIST_REQUIRED: 'Object name list is required',
      OBJECT_NAME_LIST_INVALID: 'Invalid object name list',

      SOURCE_OBJECT_NAME_NULL: 'Null source object name',
      SOURCE_OBJECT_NAME_REQUIRED: 'Source object name is required',
      SOURCE_OBJECT_NAME_INVALID: 'Invalid source object name',
      SOURCE_OBJECT_NOT_FOUND: 'Object not found',

      OBJECT_DATA_NULL: 'Object data is null',
      OBJECT_DATA_REQUIRED: 'Object data is required',
      OBJECT_DATA_INVALID: 'Invalid object data',

      DIRECTORY_NULL: 'Directory is null',
      DIRECTORY_REQUIRED: 'Directory not defined',
      DIRECTORY_INVALID: 'Invalid directory',
    });
  });
});
