import { TextMessage } from '../../../modules/system/enums/messages/text-messages/text-messages.enum';

export class TestDtoTextFilter {
  constructor(private readonly defaultDTOData: object) {}

  get acceptData() {
    const data = [
      {
        description:
          'should pass validation and transform properties when query is defined',
        data: { query: 'teste' },
        expectedResult: { ...this.defaultDTOData, query: 'teste' },
      },
      {
        description:
          'should pass validation and transform properties when query is null',
        data: { query: null },
        expectedResult: { ...this.defaultDTOData, query: null },
      },
      {
        description:
          'should pass validation and transform properties when query is undefined',
        data: { query: undefined },
        expectedResult: { ...this.defaultDTOData, query: undefined },
      },
    ];
    return data;
  }

  get errorData() {
    const data = [
      {
        description: '"query" is boolean',
        data: { query: true },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is number',
        data: { query: 4334556 },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is object',
        data: { query: {} },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is array',
        data: { query: [] },
        constraints: { isString: TextMessage.STRING },
      },
      {
        description: '"query" is boolean',
        data: { query: true },
        constraints: { isString: TextMessage.STRING },
      },
    ];
    return data;
  }
}
