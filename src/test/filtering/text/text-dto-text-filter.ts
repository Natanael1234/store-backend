import { TextMessage } from '../../../modules/system/enums/messages/text-messages/text-messages.enum';

export class TestDtoTextFilter {
  constructor() {}

  get acceptData() {
    const data = [
      {
        description:
          'should pass validation and transform properties when query is defined',
        data: 'test',
        expectedData: 'test',
      },
      {
        description:
          'should pass validation and transform properties when query is null',
        data: null,
        expectedData: null,
      },
      {
        description:
          'should pass validation and transform properties when query is undefined',
        data: undefined,
        expectedData: undefined,
      },
    ];
    return data;
  }

  get errorData() {
    const data = [
      {
        description: '"query" is boolean',
        data: true,
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is number',
        data: 4334556,
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is object',
        data: {},
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is array',
        data: [],
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is boolean',
        data: true,
        constraints: { isString: TextMessage.STRING },
      },
    ];
    return data;
  }
}
