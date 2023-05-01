import { RoleMessage } from '../../modules/user/enums/role-messages/role-messages.enum';
import { TestData, TestErrorData, TestPurpose } from '../test-data';

export function getRolesErrorDataList(
  dtoData,
  purpose: TestPurpose,
): TestErrorData[] {
  const property = 'roles';
  const list = [
    TestData.buildErrorData({
      description: 'number',
      property,
      value: 2323232,
      data: dtoData,
      errors: { isArray: RoleMessage.INVALID },
      message: { [property]: RoleMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'boolean',
      property,
      value: true,
      data: dtoData,
      errors: { isArray: RoleMessage.INVALID },
      message: { [property]: RoleMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'object',
      property,
      value: {},
      data: dtoData,
      errors: { isArray: RoleMessage.INVALID },
      message: { [property]: RoleMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'string',
      property,
      value: 'string',
      data: dtoData,
      errors: { isArray: RoleMessage.INVALID },
      message: { [property]: RoleMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'array containing invalid item',
      property,
      value: ['invalid'],
      data: dtoData,
      errors: { isEnum: RoleMessage.INVALID },
      message: { [property]: RoleMessage.INVALID },
    }),
    TestData.buildErrorData({
      description: 'empty array',
      property,
      value: [],
      data: dtoData,
      errors: { arrayMinSize: RoleMessage.MIN_LEN },
      message: { [property]: RoleMessage.MIN_LEN },
    }),
  ];
  if (purpose != 'update') {
    list.push(
      TestData.buildErrorData({
        // TODO: deveria ser testado na atualização?
        description: 'null',
        property,
        value: null,
        data: dtoData,
        errors: { isNotEmpty: RoleMessage.REQUIRED },
        message: { [property]: RoleMessage.REQUIRED },
      }),
      TestData.buildErrorData({
        description: 'undefined',
        property,
        value: undefined,
        data: dtoData,
        errors: { isNotEmpty: RoleMessage.REQUIRED },
        message: { [property]: RoleMessage.REQUIRED },
      }),
    );
  }
  return list;
}
