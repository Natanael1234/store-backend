import { DeletedFilter } from '../../../modules/system/enums/filter/deleted-filter/deleted-filter.enum';
import { DeletedMessage } from '../../../modules/system/enums/messages/deleted-messages/deleted-messages.enum';

export class TestDtoDeletedFilter {
  constructor(private readonly defaultDTOData: object) {}

  get acceptData() {
    const acceptData = [
      {
        description:
          'should pass validation and transform properties when "deleted" is null',
        data: { deleted: null },
        expectedResult: {
          ...this.defaultDTOData,
          deleted: DeletedFilter.NOT_DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is undefined',
        data: { deleted: undefined },
        expectedResult: {
          ...this.defaultDTOData,
          deleted: DeletedFilter.NOT_DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is string deleted',
        data: { deleted: 'deleted' },
        expectedResult: {
          ...this.defaultDTOData,
          deleted: DeletedFilter.DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is string not deleted',
        data: { deleted: 'not_deleted' },
        expectedResult: {
          ...this.defaultDTOData,
          deleted: DeletedFilter.NOT_DELETED,
        },
      },
      {
        description:
          'should pass validation and transform properties when "deleted" is string all',
        data: { deleted: 'all' },
        expectedResult: { ...this.defaultDTOData, deleted: DeletedFilter.ALL },
      },
    ];

    return acceptData;
  }

  get errorData() {
    const errorData = [
      {
        description: 'should fail when "deleted" is invalid string',
        data: { deleted: 'dEleteD' },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: 'should fail when "deleted" is empty string',
        data: { deleted: '' },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: 'should fail when "deleted" is boolean',
        data: { deleted: true },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: 'should fail when "deleted" is boolean string',
        data: { deleted: 'true' },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: 'should fail when "deleted" is number',
        data: { deleted: 4334556 },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: 'should fail when "deleted" is object',
        data: { deleted: {} },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
      {
        description: 'should fail when "deleted" is array',
        data: { deleted: [] },
        constraints: { isEnum: DeletedMessage.INVALID },
      },
    ];
    return errorData;
  }
}
